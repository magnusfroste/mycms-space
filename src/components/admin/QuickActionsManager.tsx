import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import {
  useAllQuickActions,
  useCreateQuickAction,
  useUpdateQuickAction,
  useDeleteQuickAction,
} from '@/hooks/useQuickActions';

export const QuickActionsManager = () => {
  const { data: actions, isLoading } = useAllQuickActions();
  const createAction = useCreateQuickAction();
  const updateAction = useUpdateQuickAction();
  const deleteAction = useDeleteQuickAction();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [formData, setFormData] = useState({
    icon: '',
    label: '',
    message: '',
    enabled: true,
  });

  const handleCreate = async () => {
    if (!formData.icon || !formData.label || !formData.message) {
      toast({
        title: 'Error',
        description: 'All fields are required',
        variant: 'destructive',
      });
      return;
    }

    const maxOrder = actions?.reduce((max, a) => Math.max(max, a.order_index), 0) || 0;
    
    await createAction.mutateAsync({
      ...formData,
      order_index: maxOrder + 1,
    });

    setFormData({ icon: '', label: '', message: '', enabled: true });
    setShowNew(false);
    toast({ title: 'Created', description: 'Quick action added' });
  };

  const handleUpdate = async (id: string) => {
    await updateAction.mutateAsync({ id, ...formData });
    setEditingId(null);
    toast({ title: 'Updated', description: 'Quick action updated' });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this quick action?')) {
      await deleteAction.mutateAsync(id);
      toast({ title: 'Deleted', description: 'Quick action removed' });
    }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    await updateAction.mutateAsync({ id, enabled });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Quick Actions</h3>
        <Button onClick={() => setShowNew(!showNew)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add New
        </Button>
      </div>

      {showNew && (
        <Card className="p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-icon">Icon (emoji)</Label>
            <Input
              id="new-icon"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              placeholder="💡"
              maxLength={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-label">Label</Label>
            <Input
              id="new-label"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="Button text"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-message">Message</Label>
            <Textarea
              id="new-message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Message to send when clicked"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={createAction.isPending}>
              Create
            </Button>
            <Button variant="outline" onClick={() => setShowNew(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {actions?.map((action) => (
          <Card key={action.id} className="p-4">
            {editingId === action.id ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Icon</Label>
                  <Input
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    maxLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Label</Label>
                  <Input
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleUpdate(action.id)}>Save</Button>
                  <Button variant="outline" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                  <span className="text-2xl">{action.icon}</span>
                  <div>
                    <div className="font-medium">{action.label}</div>
                    <div className="text-sm text-muted-foreground">{action.message}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Switch
                    checked={action.enabled}
                    onCheckedChange={(checked) => handleToggle(action.id, checked)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormData({
                        icon: action.icon,
                        label: action.label,
                        message: action.message,
                        enabled: action.enabled,
                      });
                      setEditingId(action.id);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(action.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
