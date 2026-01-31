// ============================================
// AI Module Settings
// Global AI configuration using unified modules system
// ============================================

import React from 'react';
import { Bot, Webhook, Power } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAIModule, useUpdateAIModule } from '@/models/modules';
import type { AIModuleConfig } from '@/types/modules';
import { useToast } from '@/hooks/use-toast';

const AIModuleSettings: React.FC = () => {
  const { data: module, config, isLoading } = useAIModule();
  const updateModule = useUpdateAIModule();
  const { toast } = useToast();

  const handleToggle = (enabled: boolean) => {
    updateModule.mutate(
      { enabled },
      {
        onSuccess: () => toast({ title: 'Sparad' }),
        onError: () => toast({ title: 'Fel vid sparning', variant: 'destructive' }),
      }
    );
  };

  const handleConfigUpdate = (field: keyof AIModuleConfig, value: string) => {
    if (!config) return;
    updateModule.mutate(
      { module_config: { ...config, [field]: value } },
      {
        onSuccess: () => toast({ title: 'Sparad' }),
        onError: () => toast({ title: 'Fel vid sparning', variant: 'destructive' }),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Bot className="h-8 w-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">AI Modul</h2>
          <p className="text-muted-foreground">
            Globala inställningar för AI-chatten
          </p>
        </div>
      </div>

      {/* Enable/Disable Module */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Power className="h-5 w-5" />
            Modulstatus
          </CardTitle>
          <CardDescription>
            Aktivera eller inaktivera AI-chat-modulen globalt
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enabled">Aktiverad</Label>
              <p className="text-sm text-muted-foreground">
                När inaktiverad visas inte chat-widget på sidan
              </p>
            </div>
            <Switch
              id="enabled"
              checked={module?.enabled ?? true}
              onCheckedChange={handleToggle}
            />
          </div>
        </CardContent>
      </Card>

      {/* Webhook Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Webhook
          </CardTitle>
          <CardDescription>
            Webhook-URL för att skicka chattmeddelanden till n8n eller annan backend
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhook_url">Webhook URL</Label>
            <Input
              id="webhook_url"
              type="url"
              value={config?.webhook_url || ''}
              onChange={(e) => handleConfigUpdate('webhook_url', e.target.value)}
              placeholder="https://agent.froste.eu/webhook/magnet"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <Input
              id="provider"
              value={config?.provider || 'n8n'}
              onChange={(e) => handleConfigUpdate('provider', e.target.value)}
              placeholder="n8n"
            />
            <p className="text-xs text-muted-foreground">
              Valfritt: identifiera vilken backend som används (n8n, custom, etc.)
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-muted-foreground">Framtida funktioner</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Val av AI-provider (OpenAI, Anthropic, etc.)</li>
            <li>• Rate limiting</li>
            <li>• Konversationshistorik</li>
            <li>• Analytics och statistik</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIModuleSettings;
