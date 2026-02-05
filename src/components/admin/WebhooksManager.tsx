// ============================================
// Webhooks Manager
// Centralized hub for managing outgoing webhooks
// ============================================

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Webhook, 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock,
  Mail,
  MessageSquare,
  FileText,
  Users,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { useModule, useUpdateModule } from '@/models/modules';
import type { WebhooksModuleConfig, WebhookEndpoint, WebhookEventType } from '@/types/modules';
import { defaultModuleConfigs } from '@/types/modules';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

const eventIcons: Record<WebhookEventType, typeof Mail> = {
  'contact.message_received': Mail,
  'newsletter.subscriber_added': Users,
  'blog.post_published': FileText,
  'chat.session_started': MessageSquare,
};

const eventLabels: Record<WebhookEventType, string> = {
  'contact.message_received': 'Contact Form',
  'newsletter.subscriber_added': 'Newsletter',
  'blog.post_published': 'Blog Post',
  'chat.session_started': 'Chat Session',
};

export default function WebhooksManager() {
  const { data: module, isLoading } = useModule('webhooks');
  const updateModule = useUpdateModule('webhooks');
  
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize from module or defaults
  useEffect(() => {
    if (module?.module_config) {
      const config = module.module_config as WebhooksModuleConfig;
      setEndpoints(config.endpoints || []);
    } else {
      setEndpoints(defaultModuleConfigs.webhooks.endpoints);
    }
  }, [module]);

  const handleEndpointChange = (
    eventType: WebhookEventType,
    field: keyof WebhookEndpoint,
    value: string | boolean
  ) => {
    setEndpoints((prev) =>
      prev.map((ep) =>
        ep.event_type === eventType ? { ...ep, [field]: value } : ep
      )
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await updateModule.mutateAsync({
        module_config: { endpoints } as WebhooksModuleConfig,
        enabled: true,
      });
      setHasChanges(false);
      toast.success('Webhooks saved');
    } catch (error) {
      toast.error('Failed to save webhooks');
    }
  };

  const handleTestWebhook = async (endpoint: WebhookEndpoint) => {
    if (!endpoint.url) {
      toast.error('Enter a webhook URL first');
      return;
    }

    try {
      await fetch(endpoint.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'no-cors',
        body: JSON.stringify({
          event_type: endpoint.event_type,
          timestamp: new Date().toISOString(),
          data: { test: true, message: 'Test webhook from CMS' },
        }),
      });
      toast.success('Test webhook sent');
    } catch {
      toast.error('Failed to send test webhook');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Webhook className="h-6 w-6" />
            Webhooks Hub
          </h2>
          <p className="text-muted-foreground mt-1">
            Connect system events to external services like n8n or Zapier
          </p>
        </div>
        <Button onClick={handleSave} disabled={!hasChanges || updateModule.isPending}>
          {updateModule.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save Changes
        </Button>
      </div>

      <div className="grid gap-4">
        {endpoints.map((endpoint) => {
          const Icon = eventIcons[endpoint.event_type];
          
          return (
            <Card key={endpoint.event_type}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {eventLabels[endpoint.event_type]}
                      </CardTitle>
                      <CardDescription>{endpoint.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {endpoint.last_triggered && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {endpoint.last_status === 'success' ? (
                          <CheckCircle className="h-4 w-4 text-primary" />
                        ) : endpoint.last_status === 'error' ? (
                          <XCircle className="h-4 w-4 text-destructive" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                        <span>
                          {formatDistanceToNow(new Date(endpoint.last_triggered), {
                            addSuffix: true,
                            locale: sv,
                          })}
                        </span>
                      </div>
                    )}
                    <Switch
                      checked={endpoint.enabled}
                      onCheckedChange={(checked) =>
                        handleEndpointChange(endpoint.event_type, 'enabled', checked)
                      }
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Label htmlFor={`url-${endpoint.event_type}`} className="sr-only">
                      Webhook URL
                    </Label>
                    <Input
                      id={`url-${endpoint.event_type}`}
                      placeholder="https://your-webhook-url.com/..."
                      value={endpoint.url}
                      onChange={(e) =>
                        handleEndpointChange(endpoint.event_type, 'url', e.target.value)
                      }
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleTestWebhook(endpoint)}
                    disabled={!endpoint.url}
                    title="Send test webhook"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                
                {endpoint.enabled && endpoint.url && (
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      Event: {endpoint.event_type}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      POST
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payload Structure</CardTitle>
          <CardDescription>
            All webhooks send JSON with this structure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="p-4 rounded-lg bg-muted text-sm overflow-x-auto">
{`{
  "event_type": "contact.message_received",
  "timestamp": "2025-02-05T12:00:00.000Z",
  "data": {
    // Event-specific data
  }
}`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
