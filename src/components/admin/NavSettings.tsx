import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, GripVertical, ExternalLink, Link } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import {
  useAllNavLinks,
  useCreateNavLink,
  useUpdateNavLink,
  useDeleteNavLink,
  useReorderNavLinks,
  NavLink,
} from '@/hooks/useNavLinks';
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

interface SortableNavItemProps {
  link: NavLink;
  onToggleEnabled: (link: NavLink) => void;
  onEdit: (link: NavLink) => void;
  onDelete: (id: string) => void;
}

const SortableNavItem = ({ link, onToggleEnabled, onEdit, onDelete }: SortableNavItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-card border rounded-lg"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{link.label}</span>
          {link.is_external && (
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">{link.url}</p>
      </div>

      <Switch
        checked={link.enabled}
        onCheckedChange={() => onToggleEnabled(link)}
      />

      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={() => onEdit(link)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(link.id)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
};

interface NavFormData {
  label: string;
  url: string;
  is_external: boolean;
  enabled: boolean;
}

export const NavSettings = () => {
  const { data: navLinks = [], isLoading } = useAllNavLinks();
  const createNavLink = useCreateNavLink();
  const updateNavLink = useUpdateNavLink();
  const deleteNavLink = useDeleteNavLink();
  const reorderNavLinks = useReorderNavLinks();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<NavLink | null>(null);
  const [deleteLinkId, setDeleteLinkId] = useState<string | null>(null);

  const [formData, setFormData] = useState<NavFormData>({
    label: '',
    url: '',
    is_external: false,
    enabled: true,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const resetForm = () => {
    setFormData({ label: '', url: '', is_external: false, enabled: true });
  };

  const handleAdd = async () => {
    if (!formData.label.trim() || !formData.url.trim()) {
      toast({ title: 'Validation Error', description: 'Label and URL are required', variant: 'destructive' });
      return;
    }

    const maxOrder = navLinks.length > 0 ? Math.max(...navLinks.map(l => l.order_index)) : -1;

    await createNavLink.mutateAsync({
      ...formData,
      order_index: maxOrder + 1,
    });

    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEdit = async () => {
    if (!editingLink) return;

    if (!formData.label.trim() || !formData.url.trim()) {
      toast({ title: 'Validation Error', description: 'Label and URL are required', variant: 'destructive' });
      return;
    }

    await updateNavLink.mutateAsync({
      id: editingLink.id,
      ...formData,
    });

    setIsEditDialogOpen(false);
    setEditingLink(null);
    resetForm();
    toast({ title: 'Success', description: 'Navigation link updated' });
  };

  const handleDelete = async () => {
    if (!deleteLinkId) return;
    await deleteNavLink.mutateAsync(deleteLinkId);
    setDeleteLinkId(null);
  };

  const handleToggleEnabled = async (link: NavLink) => {
    await updateNavLink.mutateAsync({
      id: link.id,
      enabled: !link.enabled,
    });
  };

  const openEditDialog = (link: NavLink) => {
    setEditingLink(link);
    setFormData({
      label: link.label,
      url: link.url,
      is_external: link.is_external,
      enabled: link.enabled,
    });
    setIsEditDialogOpen(true);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = navLinks.findIndex((l) => l.id === active.id);
    const newIndex = navLinks.findIndex((l) => l.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(navLinks, oldIndex, newIndex).map((l, index) => ({
      ...l,
      order_index: index,
    }));

    queryClient.setQueryData(['nav-links-all'], reordered);

    try {
      await reorderNavLinks.mutateAsync(
        reordered.map((l) => ({ id: l.id, order_index: l.order_index }))
      );
      toast({ title: 'Success', description: 'Navigation order updated' });
    } catch (error) {
      queryClient.invalidateQueries({ queryKey: ['nav-links-all'] });
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading navigation...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Navigation Menu</h2>
          <p className="text-muted-foreground">Manage header navigation links</p>
        </div>

        <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Link
        </Button>
      </div>

      {/* Add Dialog - separate from trigger to avoid re-render issues */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Add Navigation Link</DialogTitle>
          </DialogHeader>
          <NavForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleAdd}
            onCancel={() => { setIsAddDialogOpen(false); resetForm(); }}
            isLoading={createNavLink.isPending}
          />
        </DialogContent>
      </Dialog>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={navLinks.map(l => l.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {navLinks.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 border rounded-lg">
                No navigation links. Add your first link!
              </div>
            ) : (
              navLinks.map((link) => (
                <SortableNavItem
                  key={link.id}
                  link={link}
                  onToggleEnabled={handleToggleEnabled}
                  onEdit={openEditDialog}
                  onDelete={setDeleteLinkId}
                />
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Edit Navigation Link</DialogTitle>
          </DialogHeader>
          <NavForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleEdit}
            onCancel={() => { setIsEditDialogOpen(false); setEditingLink(null); resetForm(); }}
            isLoading={updateNavLink.isPending}
            isEdit
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteLinkId} onOpenChange={() => setDeleteLinkId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Navigation Link?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the link from the navigation. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

interface NavFormProps {
  formData: NavFormData;
  setFormData: (data: NavFormData) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isLoading: boolean;
  isEdit?: boolean;
}

const NavForm = ({ formData, setFormData, onSubmit, onCancel, isLoading, isEdit }: NavFormProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="label">Label</Label>
        <Input
          id="label"
          value={formData.label}
          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
          placeholder="e.g. About"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="url">URL</Label>
        <Input
          id="url"
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          placeholder="e.g. #about or https://example.com"
        />
        <p className="text-xs text-muted-foreground">
          Use # for page sections (e.g. #about) or full URLs for external links
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="is_external">External Link</Label>
          <p className="text-xs text-muted-foreground">Opens in new tab</p>
        </div>
        <Switch
          id="is_external"
          checked={formData.is_external}
          onCheckedChange={(checked) => setFormData({ ...formData, is_external: checked })}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="enabled">Enabled</Label>
          <p className="text-xs text-muted-foreground">Show in navigation</p>
        </div>
        <Switch
          id="enabled"
          checked={formData.enabled}
          onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={isLoading}>
          {isLoading ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Link'}
        </Button>
      </div>
    </div>
  );
};
