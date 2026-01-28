// ============================================
// Quick Actions List
// List of quick actions with create form
// ============================================

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import {
  useAllQuickActions,
  useCreateQuickAction,
  useUpdateQuickAction,
  useDeleteQuickAction,
} from '@/hooks/useQuickActions';
import { useToast } from '@/hooks/use-toast';
import IconPicker from './IconPicker';
import QuickActionItem from './QuickActionItem';

const QuickActionsList: React.FC = () => {
  const { data: actions } = useAllQuickActions();
  const createAction = useCreateQuickAction();
  const updateAction = useUpdateQuickAction();
  const deleteAction = useDeleteQuickAction();
  const { toast } = useToast();

  const [showNew, setShowNew] = useState(false);
  const [newAction, setNewAction] = useState({ icon: 'Sparkles', label: '', message: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ icon: '', label: '', message: '' });

  const handleCreateAction = async () => {
    if (!newAction.label || !newAction.message) {
      toast({ title: 'Fill in all fields', variant: 'destructive' });
      return;
    }
    const maxOrder = actions?.reduce((max, a) => Math.max(max, a.order_index), 0) || 0;
    await createAction.mutateAsync({
      ...newAction,
      order_index: maxOrder + 1,
      enabled: true,
    });
    setNewAction({ icon: 'Sparkles', label: '', message: '' });
    setShowNew(false);
    toast({ title: 'Created' });
  };

  const startEditing = (action: { id: string; icon: string; label: string; message: string }) => {
    setEditingId(action.id);
    setEditData({ icon: action.icon, label: action.label, message: action.message });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditData({ icon: '', label: '', message: '' });
  };

  const saveEditing = async () => {
    if (!editingId || !editData.label || !editData.message) {
      toast({ title: 'Fill in all fields', variant: 'destructive' });
      return;
    }
    await updateAction.mutateAsync({ id: editingId, ...editData });
    toast({ title: 'Updated' });
    cancelEditing();
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    await updateAction.mutateAsync({ id, enabled });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this quick action?')) {
      await deleteAction.mutateAsync(id);
      toast({ title: 'Deleted' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
          Quick Actions
        </h4>
        <Button onClick={() => setShowNew(!showNew)} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {showNew && (
        <Card className="p-4 space-y-3 bg-muted/30">
          <div className="flex gap-3 items-end">
            <div>
              <Label className="text-xs">Icon</Label>
              <IconPicker
                value={newAction.icon}
                onChange={(v) => setNewAction({ ...newAction, icon: v })}
              />
            </div>
            <div className="flex-1">
              <Label className="text-xs">Label</Label>
              <Input
                value={newAction.label}
                onChange={(e) => setNewAction({ ...newAction, label: e.target.value })}
                placeholder="Button text..."
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">Message</Label>
            <Input
              value={newAction.message}
              onChange={(e) => setNewAction({ ...newAction, message: e.target.value })}
              placeholder="Message to send..."
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreateAction} size="sm" disabled={createAction.isPending}>
              Create
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowNew(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {actions?.map((action) => (
          <QuickActionItem
            key={action.id}
            action={action}
            isEditing={editingId === action.id}
            editData={editData}
            onStartEdit={() => startEditing(action)}
            onCancelEdit={cancelEditing}
            onSaveEdit={saveEditing}
            onEditChange={setEditData}
            onToggle={(enabled) => handleToggle(action.id, enabled)}
            onDelete={() => handleDelete(action.id)}
            isSaving={updateAction.isPending}
          />
        ))}
      </div>
    </div>
  );
};

export default QuickActionsList;
