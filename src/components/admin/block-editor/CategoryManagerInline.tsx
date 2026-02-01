// ============================================
// Category Manager Inline
// Manages categories within block_config
// ============================================

import React, { useState } from 'react';
import { Plus, Trash2, GripVertical, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  slug: string;
  order_index: number;
  enabled: boolean;
}

interface CategoryManagerInlineProps {
  categories: Category[];
  onChange: (categories: Category[]) => void;
}

interface SortableCategoryItemProps {
  category: Category;
  onEdit: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

const SortableCategoryItem: React.FC<SortableCategoryItemProps> = ({
  category,
  onEdit,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(category.name);

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
  };

  const handleSave = () => {
    if (editName.trim()) {
      onEdit(category.id, editName.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditName(category.name);
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 p-2 rounded-lg border bg-background',
        isDragging && 'opacity-50 shadow-lg'
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {isEditing ? (
        <div className="flex-1 flex items-center gap-2">
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
            className="h-8"
            autoFocus
          />
          <Button variant="ghost" size="icon" onClick={handleSave} className="h-8 w-8">
            <Check className="h-4 w-4 text-green-600" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleCancel} className="h-8 w-8">
            <X className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      ) : (
        <>
          <span className="flex-1 text-sm font-medium">{category.name}</span>
          <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">
            {category.slug}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditing(true)}
            className="h-8 w-8"
          >
            <Edit2 className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(category.id)}
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </>
      )}
    </div>
  );
};

const CategoryManagerInline: React.FC<CategoryManagerInlineProps> = ({
  categories,
  onChange,
}) => {
  const [newName, setNewName] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const sortedCategories = [...categories].sort((a, b) => a.order_index - b.order_index);

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const handleAdd = () => {
    if (!newName.trim()) return;

    const slug = generateSlug(newName);
    const exists = categories.some((c) => c.slug === slug);
    if (exists) {
      return; // Slug already exists
    }

    const newCategory: Category = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      slug,
      order_index: categories.length,
      enabled: true,
    };

    onChange([...categories, newCategory]);
    setNewName('');
  };

  const handleEdit = (id: string, name: string) => {
    const slug = generateSlug(name);
    const updated = categories.map((c) =>
      c.id === id ? { ...c, name, slug } : c
    );
    onChange(updated);
  };

  const handleDelete = (id: string) => {
    const filtered = categories.filter((c) => c.id !== id);
    const reindexed = filtered.map((c, idx) => ({ ...c, order_index: idx }));
    onChange(reindexed);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortedCategories.findIndex((c) => c.id === active.id);
    const newIndex = sortedCategories.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...sortedCategories];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    const updated = reordered.map((c, idx) => ({ ...c, order_index: idx }));
    onChange(updated);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Kategorier</CardTitle>
        <CardDescription>
          Hantera kategorier för projekten
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new category */}
        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Ny kategori..."
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="flex-1"
          />
          <Button onClick={handleAdd} disabled={!newName.trim()} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Lägg till
          </Button>
        </div>

        {/* Category list */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sortedCategories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {sortedCategories.map((category) => (
                <SortableCategoryItem
                  key={category.id}
                  category={category}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {sortedCategories.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Inga kategorier ännu. Lägg till en ovan.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default CategoryManagerInline;
