// ============================================
// General Settings
// Global admin settings (Admin AI, API Tokens, etc.)
// ============================================

import React, { useState } from 'react';
import { Settings2, Bot, Key, Copy, RefreshCw, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAIModule, useUpdateAIModule } from '@/models/modules';
import type { AdminAIProvider } from '@/types/modules';
import { toast } from 'sonner';

// Generate a cryptographically random hex key
function generateApiKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

// ---- Reusable Token Row ----
interface TokenRowProps {
  label: string;
  description: string;
  tokenKey: string; // key in module_config
  tokenConfig: Record<string, unknown> | null;
  moduleId: string | undefined;
  onUpdated: () => void;
}

const TokenRow: React.FC<TokenRowProps> = ({ label, description, tokenKey, tokenConfig, moduleId, onUpdated }) => {
  const [showKey, setShowKey] = useState(false);
  const value = tokenConfig?.[tokenKey] as string | undefined;

  const upsert = useMutation({
    mutationFn: async (newKey: string) => {
      const config = { ...(tokenConfig || {}), [tokenKey]: newKey };
      if (moduleId) {
        await supabase.from('modules').update({ module_config: config }).eq('id', moduleId);
      } else {
        await supabase.from('modules').insert({ module_type: 'api_tokens', module_config: config });
      }
    },
    onSuccess: () => { onUpdated(); toast.success(`${label} saved`); },
    onError: () => toast.error(`Failed to save ${label}`),
  });

  const handleGenerate = () => upsert.mutate(generateApiKey());
  const handleCopy = () => { if (value) { navigator.clipboard.writeText(value); toast.success('Copied'); } };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            readOnly
            value={value ? (showKey ? value : '••••••••••••••••••••••••') : 'No key generated'}
            className="pr-10 font-mono text-sm bg-muted/50"
          />
          {value && (
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>
        {value && (
          <Button variant="outline" size="icon" onClick={handleCopy} title="Copy">
            <Copy className="h-4 w-4" />
          </Button>
        )}
        {value ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="icon" disabled={upsert.isPending} title="Rotate key">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Rotate {label}?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  The current key will be permanently invalidated. All clients using it will lose access until updated.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleGenerate} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Rotate
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Button onClick={handleGenerate} disabled={upsert.isPending}>
            Generate
          </Button>
        )}
      </div>
    </div>
  );
};

// ---- API Tokens Card ----
const ApiTokensCard: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: tokenConfig, isLoading } = useQuery({
    queryKey: ['api-tokens-module'],
    queryFn: async () => {
      const { data } = await supabase
        .from('modules')
        .select('id, module_config')
        .eq('module_type', 'api_tokens')
        .maybeSingle();
      return data;
    },
  });

  const config = (tokenConfig?.module_config as Record<string, unknown>) || null;
  const moduleId = tokenConfig?.id;
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['api-tokens-module'] });

  if (isLoading) return <Skeleton className="h-32 w-full" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          API Tokens
        </CardTitle>
        <CardDescription>
          Keys for external agents, Chrome extension, and integrations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* A2A Token */}
        <TokenRow
          label="A2A API Key"
          description="Agent-to-agent communication"
          tokenKey="a2a_api_key"
          tokenConfig={config}
          moduleId={moduleId}
          onUpdated={invalidate}
        />

        <div className="border-t border-border" />

        {/* Signal Ingest Token */}
        <TokenRow
          label="Signal Ingest Token"
          description="Chrome extension & signals"
          tokenKey="signal_ingest_token"
          tokenConfig={config}
          moduleId={moduleId}
          onUpdated={invalidate}
        />

        {/* Endpoint info */}
        <div className="rounded-lg bg-muted/50 p-4 space-y-3">
          <p className="text-sm font-medium">🔗 Endpoints</p>
          
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Discovery (public)</Label>
            <div className="flex gap-2 items-center">
              <code className="text-xs flex-1 bg-background rounded p-2 border overflow-x-auto">
                {`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-card`}
              </code>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => { navigator.clipboard.writeText(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-card`); toast.success('Copied'); }}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">A2A Negotiate</Label>
            <div className="flex gap-2 items-center">
              <code className="text-xs flex-1 bg-background rounded p-2 border overflow-x-auto">
                {`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/a2a-negotiate`}
              </code>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => { navigator.clipboard.writeText(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/a2a-negotiate`); toast.success('Copied'); }}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Signal Ingest</Label>
            <div className="flex gap-2 items-center">
              <code className="text-xs flex-1 bg-background rounded p-2 border overflow-x-auto">
                {`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/signal-ingest`}
              </code>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => { navigator.clipboard.writeText(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/signal-ingest`); toast.success('Copied'); }}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Header format</Label>
            <code className="text-xs block bg-background rounded p-2 border overflow-x-auto">
              Authorization: Bearer {'<your-token>'}
            </code>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
// ---- Main Component ----
const GeneralSettings: React.FC = () => {
  const { config, isLoading } = useAIModule();
  const updateModule = useUpdateAIModule();

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
        onSuccess: () => toast.success('Saved'),
        onError: () => toast.error('Error saving'),
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

      {/* API Tokens */}
      <ApiTokensCard />

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
