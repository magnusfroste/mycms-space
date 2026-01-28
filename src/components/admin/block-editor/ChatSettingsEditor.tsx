// ============================================
// Chat Settings Editor
// Inline editing for chat widget settings + quick actions
// ============================================

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useChatSettings, useUpdateChatSettings } from '@/models/chatSettings';
import { useAllQuickActions } from '@/hooks/useQuickActions';
import { useToast } from '@/hooks/use-toast';
import ChatSettingsFields from './ChatSettingsFields';
import QuickActionsList from './QuickActionsList';

const ChatSettingsEditor: React.FC = () => {
  const { data: settings, isLoading: settingsLoading } = useChatSettings();
  const updateSettings = useUpdateChatSettings();
  const { isLoading: actionsLoading } = useAllQuickActions();
  const { toast } = useToast();

  const handleSettingsUpdate = (field: string, value: string) => {
    updateSettings.mutate(
      { [field]: value },
      {
        onSuccess: () => toast({ title: 'Saved' }),
        onError: () => toast({ title: 'Error', variant: 'destructive' }),
      }
    );
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
      <ChatSettingsFields settings={settings} onUpdate={handleSettingsUpdate} />
      <QuickActionsList />
    </div>
  );
};

export default ChatSettingsEditor;
