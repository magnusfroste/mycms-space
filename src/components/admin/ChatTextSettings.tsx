import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { useChatSettings, useUpdateChatSettings } from '@/hooks/useChatSettings';

export const ChatTextSettings = () => {
  const { data: settings, isLoading } = useChatSettings();
  const updateSettings = useUpdateChatSettings();
  const [initialPlaceholder, setInitialPlaceholder] = useState('');
  const [activePlaceholder, setActivePlaceholder] = useState('');

  useEffect(() => {
    if (settings) {
      setInitialPlaceholder(settings.initial_placeholder);
      setActivePlaceholder(settings.active_placeholder);
    }
  }, [settings]);

  const handleSave = async () => {
    await updateSettings.mutateAsync({
      initial_placeholder: initialPlaceholder,
      active_placeholder: activePlaceholder,
    });
    toast({
      title: 'Saved',
      description: 'Chat text updated successfully',
    });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="initial">Landing Page Placeholder</Label>
        <Textarea
          id="initial"
          value={initialPlaceholder}
          onChange={(e) => setInitialPlaceholder(e.target.value)}
          placeholder="Initial message shown on landing page"
          rows={3}
        />
        <p className="text-sm text-muted-foreground">
          This text appears in the chat input on the landing page
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="active">Active Chat Placeholder</Label>
        <Textarea
          id="active"
          value={activePlaceholder}
          onChange={(e) => setActivePlaceholder(e.target.value)}
          placeholder="Message shown during active chat"
          rows={2}
        />
        <p className="text-sm text-muted-foreground">
          This text appears in the chat input during an active conversation
        </p>
      </div>

      <Button onClick={handleSave} disabled={updateSettings.isPending}>
        {updateSettings.isPending ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  );
};
