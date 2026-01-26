// ============================================
// Chat Settings Editor
// Inline editing for chat widget settings
// ============================================

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useChatSettings, useUpdateChatSettings } from '@/models/chatSettings';
import { useToast } from '@/hooks/use-toast';

const ChatSettingsEditor: React.FC = () => {
  const { data: settings, isLoading } = useChatSettings();
  const updateSettings = useUpdateChatSettings();
  const { toast } = useToast();

  const handleUpdate = (field: string, value: string) => {
    updateSettings.mutate(
      { [field]: value },
      {
        onSuccess: () => {
          toast({ title: 'Sparat', description: 'Chattinställningar uppdaterade' });
        },
        onError: () => {
          toast({ title: 'Fel', description: 'Kunde inte spara', variant: 'destructive' });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Inga chattinställningar hittades
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="space-y-2">
        <Label htmlFor="initial_placeholder">Välkomstmeddelande</Label>
        <Textarea
          id="initial_placeholder"
          value={settings.initial_placeholder}
          onChange={(e) => handleUpdate('initial_placeholder', e.target.value)}
          placeholder="Meddelande som visas innan användaren skickat något..."
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          Visas i chatten innan användaren har skickat ett meddelande
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="active_placeholder">Aktiv placeholder</Label>
        <Input
          id="active_placeholder"
          value={settings.active_placeholder}
          onChange={(e) => handleUpdate('active_placeholder', e.target.value)}
          placeholder="Placeholder-text i inputfältet..."
        />
        <p className="text-xs text-muted-foreground">
          Visas som placeholder i textfältet efter att chatten startat
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="webhook_url">Webhook URL</Label>
        <Input
          id="webhook_url"
          value={settings.webhook_url}
          onChange={(e) => handleUpdate('webhook_url', e.target.value)}
          placeholder="https://..."
          type="url"
        />
        <p className="text-xs text-muted-foreground">
          URL till n8n eller annan webhook för att hantera chattmeddelanden
        </p>
      </div>
    </div>
  );
};

export default ChatSettingsEditor;
