// ============================================
// General Settings
// Global admin settings (Admin AI, etc.)
// ============================================

import React from 'react';
import { Settings2, Bot } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAIModule, useUpdateAIModule } from '@/models/modules';
import type { AdminAIProvider } from '@/types/modules';
import { useToast } from '@/hooks/use-toast';

const GeneralSettings: React.FC = () => {
  const { config, isLoading } = useAIModule();
  const updateModule = useUpdateAIModule();
  const { toast } = useToast();

  const handleAdminProviderChange = (value: AdminAIProvider) => {
    if (!config) return;
    
    updateModule.mutate(
      { 
        module_config: { 
          ...config, 
          admin_ai_provider: value,
          admin_ai_config: {
            model: value === 'openai' ? 'gpt-4o' : value === 'gemini' ? 'gemini-1.5-flash' : 'google/gemini-2.5-flash'
          }
        } 
      },
      {
        onSuccess: () => toast({ title: 'Saved' }),
        onError: () => toast({ title: 'Error saving', variant: 'destructive' }),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Settings2 className="h-8 w-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Settings</h2>
          <p className="text-muted-foreground">
            Global admin settings
          </p>
        </div>
      </div>

      {/* Admin AI Tools Provider */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Admin AI Tools
          </CardTitle>
          <CardDescription>
            AI provider for in-app assistance (Prompt Enhancer, Text Actions, Page Builder)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin_ai_provider">Provider</Label>
            <Select 
              value={config?.admin_ai_provider || 'lovable'} 
              onValueChange={handleAdminProviderChange}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent className="bg-popover border z-50">
                <SelectItem value="lovable">
                  <span className="font-medium">Lovable AI</span>
                </SelectItem>
                <SelectItem value="openai">
                  <span className="font-medium">OpenAI</span>
                </SelectItem>
                <SelectItem value="gemini">
                  <span className="font-medium">Google Gemini</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 space-y-1">
            <p className="text-sm font-medium">
              Admin tools use: <span className="text-primary">
                {config?.admin_ai_provider === 'openai' ? 'OpenAI' : 
                 config?.admin_ai_provider === 'gemini' ? 'Google Gemini' : 'Lovable AI'}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              Used by Prompt Enhancer, Text Actions, and Page Builder.
              {config?.admin_ai_provider === 'openai' && ' Requires OPENAI_API_KEY secret.'}
              {config?.admin_ai_provider === 'gemini' && ' Requires GEMINI_API_KEY secret.'}
            </p>
          </div>
          
          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <p className="text-sm font-medium">💡 Why separate from Chat?</p>
            <p className="text-xs text-muted-foreground">
              Visitor chat supports tool calls (Telegram, email, search, etc.) via n8n. 
              Admin tools only need simple text-in/text-out, so they can use any direct AI provider.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeneralSettings;
