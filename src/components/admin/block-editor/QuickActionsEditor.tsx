// ============================================
// Quick Actions Editor
// Inline editor for managing quick action buttons
// ============================================

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Trash2, GripVertical, Pencil, X, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { iconMap } from '@/lib/constants/iconMaps';
import {
  useAllQuickActions,
  useCreateQuickAction,
  useUpdateQuickAction,
  useDeleteQuickAction,
} from '@/models/quickActions';
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
import { useQueryClient } from '@tanstack/react-query';
import type { QuickAction } from '@/types';

interface SortableActionItemProps {
  action: QuickAction;
  onEdit: (action: QuickAction) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
}

const SortableActionItem: React.FC<SortableActionItemProps> = ({
  action,
  onEdit,
  onDelete,
  onToggle,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: action.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-muted/30 border rounded-lg"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="flex-shrink-0 text-muted-foreground">
        {iconMap[action.icon] || action.icon}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{action.label}</p>
        <p className="text-xs text-muted-foreground truncate">{action.message}</p>
      </div>

      <Switch
        checked={action.enabled}
        onCheckedChange={(checked) => onToggle(action.id, checked)}
      />

      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(action)}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onDelete(action.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};

interface ActionFormData {
  icon: string;
  label: string;
  message: string;
  enabled: boolean;
}

const QuickActionsEditor: React.FC = () => {
  const { data: actions = [], isLoading } = useAllQuickActions();
  const createAction = useCreateQuickAction();
  const updateAction = useUpdateQuickAction();
  const deleteAction = useDeleteQuickAction();
  const queryClient = useQueryClient();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<QuickAction | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ActionFormData>({
    icon: 'Sparkles',
    label: '',
    message: '',
    enabled: true,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const iconOptions = Object.keys(iconMap);

  const resetForm = () => {
    setFormData({ icon: 'Sparkles', label: '', message: '', enabled: true });
  };

  const handleCreate = async () => {
    if (!formData.label.trim() || !formData.message.trim()) {
      toast({ title: 'Error', description: 'Label and message are required', variant: 'destructive' });
      return;
    }

    const maxOrder = actions.reduce((max, a) => Math.max(max, a.order_index), -1);
    await createAction.mutateAsync({ ...formData, order_index: maxOrder + 1 });
    setIsAddOpen(false);
    resetForm();
    toast({ title: 'Success', description: 'Quick action added' });
  };

  const handleUpdate = async () => {
    if (!editingAction) return;
    if (!formData.label.trim() || !formData.message.trim()) {
      toast({ title: 'Error', description: 'Label and message are required', variant: 'destructive' });
      return;
    }

    await updateAction.mutateAsync({ id: editingAction.id, ...formData });
    setEditingAction(null);
    resetForm();
    toast({ title: 'Success', description: 'Quick action updated' });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteAction.mutateAsync(deleteId);
    setDeleteId(null);
    toast({ title: 'Deleted', description: 'Quick action removed' });
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    await updateAction.mutateAsync({ id, enabled });
  };

  const openEdit = (action: QuickAction) => {
    setEditingAction(action);
    setFormData({
      icon: action.icon,
      label: action.label,
      message: action.message,
      enabled: action.enabled,
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = actions.findIndex((a) => a.id === active.id);
    const newIndex = actions.findIndex((a) => a.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(actions, oldIndex, newIndex).map((a, idx) => ({
      ...a,
      order_index: idx,
    }));

    // Optimistic update
    queryClient.setQueryData(['quick-actions'], reordered);

    // Persist changes
    try {
      for (const action of reordered) {
        await updateAction.mutateAsync({ id: action.id, order_index: action.order_index });
      }
    } catch {
      queryClient.invalidateQueries({ queryKey: ['quick-actions'] });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  const renderForm = (isEdit: boolean) => (
    <Card className="p-4 space-y-4 border-primary/50">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">{isEdit ? 'Edit Quick Action' : 'New Quick Action'}</h4>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => {
            isEdit ? setEditingAction(null) : setIsAddOpen(false);
            resetForm();
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Icon</Label>
          <Select value={formData.icon} onValueChange={(v) => setFormData({ ...formData, icon: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[200px] bg-popover">
              {iconOptions.map((icon) => (
                <SelectItem key={icon} value={icon}>
                  <div className="flex items-center gap-2">
                    {iconMap[icon]}
                    <span>{icon}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Label</Label>
          <Input
            value={formData.label}
            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            placeholder="Button text"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Message</Label>
        <Textarea
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="Message to send when clicked"
          rows={2}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch
            checked={formData.enabled}
            onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
          />
          <Label>Enabled</Label>
        </div>
        <Button
          onClick={isEdit ? handleUpdate : handleCreate}
          disabled={isEdit ? updateAction.isPending : createAction.isPending}
          size="sm"
        >
          <Check className="mr-2 h-4 w-4" />
          {isEdit ? 'Save' : 'Add'}
        </Button>
      </div>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-medium">Quick Actions</h4>
          <p className="text-xs text-muted-foreground">Shortcut buttons shown in the chat</p>
        </div>
        {!isAddOpen && !editingAction && (
          <Button onClick={() => setIsAddOpen(true)} size="sm" variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        )}
      </div>

      {isAddOpen && renderForm(false)}
      {editingAction && renderForm(true)}

      {!isAddOpen && !editingAction && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={actions.map((a) => a.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {actions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No quick actions yet. Add your first one!
                </p>
              ) : (
                actions.map((action) => (
                  <SortableActionItem
                    key={action.id}
                    action={action}
                    onEdit={openEdit}
                    onDelete={setDeleteId}
                    onToggle={handleToggle}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quick Action?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the quick action button from the chat. This cannot be undone.
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

export default QuickActionsEditor;
