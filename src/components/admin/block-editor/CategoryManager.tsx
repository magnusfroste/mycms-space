// ============================================
// Category Manager
// Full CRUD for categories in the inline editor
// ============================================

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Check, 
  X,
  Pencil 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useAllCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useReorderCategories,
} from '@/models/categories';
import type { Category } from '@/types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Generate slug from name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

interface SortableCategoryItemProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
  onToggleEnabled: (id: string, enabled: boolean) => void;
}

const SortableCategoryItem: React.FC<SortableCategoryItemProps> = ({
  category,
  onEdit,
  onDelete,
  onToggleEnabled,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-background border rounded-lg"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{category.name}</p>
        <p className="text-xs text-muted-foreground truncate">{category.slug}</p>
      </div>

      <Switch
        checked={category.enabled}
        onCheckedChange={(checked) => onToggleEnabled(category.id, checked)}
      />

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onEdit(category)}
        className="h-8 w-8"
      >
        <Pencil className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(category.id)}
        className="h-8 w-8 text-destructive hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

const CategoryManager: React.FC = () => {
  const { toast } = useToast();
  const { data: categories, isLoading } = useAllCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const reorderCategories = useReorderCategories();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', slug: '' });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleNameChange = (name: string) => {
    setFormData({
      name,
      slug: generateSlug(name),
    });
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast({ title: 'Namn krävs', variant: 'destructive' });
      return;
    }

    const maxOrder = categories?.reduce((max, c) => Math.max(max, c.order_index), -1) ?? -1;

    try {
      await createCategory.mutateAsync({
        name: formData.name.trim(),
        slug: formData.slug || generateSlug(formData.name),
        order_index: maxOrder + 1,
        enabled: true,
      });
      setFormData({ name: '', slug: '' });
      setIsCreating(false);
      toast({ title: 'Kategori skapad' });
    } catch (error) {
      toast({ title: 'Kunde inte skapa kategori', variant: 'destructive' });
    }
  };

  const handleUpdate = async () => {
    if (!editingId || !formData.name.trim()) {
      toast({ title: 'Namn krävs', variant: 'destructive' });
      return;
    }

    try {
      await updateCategory.mutateAsync({
        id: editingId,
        name: formData.name.trim(),
        slug: formData.slug || generateSlug(formData.name),
      });
      setFormData({ name: '', slug: '' });
      setEditingId(null);
      toast({ title: 'Kategori uppdaterad' });
    } catch (error) {
      toast({ title: 'Kunde inte uppdatera kategori', variant: 'destructive' });
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setFormData({ name: category.name, slug: category.slug });
    setIsCreating(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCategory.mutateAsync(id);
      toast({ title: 'Kategori borttagen' });
    } catch (error) {
      toast({ title: 'Kunde inte ta bort kategori', variant: 'destructive' });
    }
  };

  const handleToggleEnabled = async (id: string, enabled: boolean) => {
    try {
      await updateCategory.mutateAsync({ id, enabled });
    } catch (error) {
      toast({ title: 'Kunde inte uppdatera kategori', variant: 'destructive' });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !categories) return;

    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);
    const newOrder = arrayMove(categories, oldIndex, newIndex);

    try {
      await reorderCategories.mutateAsync(newOrder.map((c) => c.id));
    } catch (error) {
      toast({ title: 'Kunde inte ändra ordning', variant: 'destructive' });
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsCreating(false);
    setFormData({ name: '', slug: '' });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          Kategorier ({categories?.length || 0})
        </Label>
        {!isCreating && !editingId && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsCreating(true);
              setFormData({ name: '', slug: '' });
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Ny kategori
          </Button>
        )}
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <Card className="border-primary/50">
          <CardContent className="pt-4 space-y-4">
            <div className="space-y-2">
              <Label>Namn</Label>
              <Input
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="T.ex. AI & Machine Learning"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Slug (URL-vänligt)</Label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="ai-machine-learning"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={cancelEdit}>
                <X className="h-4 w-4 mr-1" />
                Avbryt
              </Button>
              <Button
                size="sm"
                onClick={editingId ? handleUpdate : handleCreate}
                disabled={createCategory.isPending || updateCategory.isPending}
              >
                <Check className="h-4 w-4 mr-1" />
                {editingId ? 'Spara' : 'Skapa'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category List with Drag & Drop */}
      {categories && categories.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={categories.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {categories.map((category) => (
                <SortableCategoryItem
                  key={category.id}
                  category={category}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleEnabled={handleToggleEnabled}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {categories?.length === 0 && !isCreating && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Inga kategorier ännu. Klicka "Ny kategori" för att skapa en.
        </p>
      )}
    </div>
  );
};

export default CategoryManager;
