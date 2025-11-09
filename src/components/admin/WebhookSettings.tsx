import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { useChatSettings, useUpdateChatSettings } from '@/hooks/useChatSettings';

export const WebhookSettings = () => {
  const { data: settings, isLoading } = useChatSettings();
  const updateSettings = useUpdateChatSettings();
  const [webhookUrl, setWebhookUrl] = useState('');

  useEffect(() => {
    if (settings) {
      setWebhookUrl(settings.webhook_url);
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      new URL(webhookUrl); // Validate URL
      await updateSettings.mutateAsync({ webhook_url: webhookUrl });
      toast({
        title: 'Saved',
        description: 'Webhook URL updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Please enter a valid URL',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="webhook">Webhook URL</Label>
        <Input
          id="webhook"
          type="url"
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
          placeholder="https://example.com/webhook"
        />
      </div>
      <Button onClick={handleSave} disabled={updateSettings.isPending}>
        {updateSettings.isPending ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  );
};
