// ============================================
// Chat Settings Editor
// Inline editing for chat widget settings + quick actions
// ============================================

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useChatSettings, useUpdateChatSettings } from '@/models/chatSettings';
import {
  useAllQuickActions,
  useCreateQuickAction,
  useUpdateQuickAction,
  useDeleteQuickAction,
} from '@/hooks/useQuickActions';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { iconMap } from '@/lib/constants/iconMaps';
import IconPicker from './IconPicker';

const ChatSettingsEditor: React.FC = () => {
  const { data: settings, isLoading: settingsLoading } = useChatSettings();
  const updateSettings = useUpdateChatSettings();
  const { data: actions, isLoading: actionsLoading } = useAllQuickActions();
  const createAction = useCreateQuickAction();
  const updateAction = useUpdateQuickAction();
  const deleteAction = useDeleteQuickAction();
  const { toast } = useToast();

  const [showNew, setShowNew] = useState(false);
  const [newAction, setNewAction] = useState({ icon: 'Sparkles', label: '', message: '' });

  const handleSettingsUpdate = (field: string, value: string) => {
    updateSettings.mutate(
      { [field]: value },
      {
        onSuccess: () => toast({ title: 'Sparat' }),
        onError: () => toast({ title: 'Fel', variant: 'destructive' }),
      }
    );
  };

  const handleCreateAction = async () => {
    if (!newAction.label || !newAction.message) {
      toast({ title: 'Fyll i alla fält', variant: 'destructive' });
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
    toast({ title: 'Skapad' });
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    await updateAction.mutateAsync({ id, enabled });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Ta bort denna quick action?')) {
      await deleteAction.mutateAsync(id);
      toast({ title: 'Borttagen' });
    }
  };

  if (settingsLoading || actionsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Chat Settings */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
          Chattinställningar
        </h4>
        <div className="space-y-2">
          <Label htmlFor="initial_placeholder">Välkomstmeddelande</Label>
          <Textarea
            id="initial_placeholder"
            value={settings?.initial_placeholder || ''}
            onChange={(e) => handleSettingsUpdate('initial_placeholder', e.target.value)}
            placeholder="Meddelande som visas innan användaren skickat något..."
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="active_placeholder">Aktiv placeholder</Label>
          <Input
            id="active_placeholder"
            value={settings?.active_placeholder || ''}
            onChange={(e) => handleSettingsUpdate('active_placeholder', e.target.value)}
            placeholder="Placeholder-text i inputfältet..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="webhook_url">Webhook URL</Label>
          <Input
            id="webhook_url"
            value={settings?.webhook_url || ''}
            onChange={(e) => handleSettingsUpdate('webhook_url', e.target.value)}
            placeholder="https://..."
            type="url"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            Quick Actions
          </h4>
          <Button onClick={() => setShowNew(!showNew)} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            Lägg till
          </Button>
        </div>

        {showNew && (
          <Card className="p-4 space-y-3 bg-muted/30">
            <div className="flex gap-3 items-end">
              <div>
                <Label className="text-xs">Ikon</Label>
                <IconPicker value={newAction.icon} onChange={(v) => setNewAction({ ...newAction, icon: v })} />
              </div>
              <div className="flex-1">
                <Label className="text-xs">Label</Label>
                <Input
                  value={newAction.label}
                  onChange={(e) => setNewAction({ ...newAction, label: e.target.value })}
                  placeholder="Knapptext..."
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Meddelande</Label>
              <Input
                value={newAction.message}
                onChange={(e) => setNewAction({ ...newAction, message: e.target.value })}
                placeholder="Meddelande som skickas..."
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateAction} size="sm" disabled={createAction.isPending}>
                Skapa
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowNew(false)}>
                Avbryt
              </Button>
            </div>
          </Card>
        )}

        <div className="space-y-2">
          {actions?.map((action) => (
            <Card key={action.id} className="p-3 flex items-center gap-3">
              <GripVertical className="h-4 w-4 text-muted-foreground/50" />
              <div className="text-muted-foreground">
                {iconMap[action.icon] || action.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{action.label}</div>
                <div className="text-xs text-muted-foreground truncate">{action.message}</div>
              </div>
              <Switch
                checked={action.enabled}
                onCheckedChange={(checked) => handleToggle(action.id, checked)}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => handleDelete(action.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChatSettingsEditor;
