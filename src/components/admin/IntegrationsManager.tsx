// ============================================
// Integrations Manager
// Catalog of available integrations (n8n, OpenAI, etc.)
// ============================================

import React, { useState, useMemo } from 'react';
import { Webhook, Bot, Sparkles, Server, Check, ExternalLink, Settings, Copy, Eye, ChevronDown, Circle, AlertCircle, Key } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAIModule, useUpdateAIModule } from '@/models/modules';
import { useAIChatContext } from '@/hooks/useAIChatContext';
import type { AIIntegrationType, N8nIntegration, LovableIntegration, OpenAIIntegration, GeminiIntegration, AIModuleConfig } from '@/types/modules';
import { integrationsMeta, defaultIntegrations } from '@/types/modules';

// Secret names for each integration
const integrationSecrets: Partial<Record<AIIntegrationType, string>> = {
  openai: 'OPENAI_API_KEY',
  gemini: 'GEMINI_API_KEY',
};
import { useToast } from '@/hooks/use-toast';

// Integration icons
const integrationIcons: Record<AIIntegrationType, React.ReactNode> = {
  n8n: <Webhook className="h-5 w-5" />,
  lovable: <Sparkles className="h-5 w-5" />,
  openai: <Bot className="h-5 w-5" />,
  gemini: <Sparkles className="h-5 w-5" />,
  ollama: <Server className="h-5 w-5" />,
};

const integrationColors: Record<AIIntegrationType, string> = {
  n8n: 'text-orange-500',
  lovable: 'text-pink-500',
  openai: 'text-green-500',
  gemini: 'text-blue-500',
  ollama: 'text-purple-500',
};

const IntegrationsManager: React.FC = () => {
  const { data: module, config, isLoading } = useAIModule();
  const updateModule = useUpdateAIModule();
  const { toast } = useToast();
  const [expandedIntegration, setExpandedIntegration] = useState<AIIntegrationType | null>(null);
  const [showPayloadPreview, setShowPayloadPreview] = useState(false);
  
  // Get context data for preview
  const { contextData, hasContext } = useAIChatContext();

  const handleConfigUpdate = (updates: Partial<AIModuleConfig>) => {
    if (!config) return;
    updateModule.mutate(
      { module_config: { ...config, ...updates } },
      {
        onSuccess: () => toast({ title: 'Saved' }),
        onError: () => toast({ title: 'Error saving', variant: 'destructive' }),
      }
    );
  };

  const handleIntegrationFieldUpdate = (integrationType: AIIntegrationType, field: string, value: string) => {
    if (!config) return;
    
    // Get existing integration or default
    const existingIntegration = config.integration?.type === integrationType 
      ? config.integration 
      : defaultIntegrations[integrationType];
    
    const updatedIntegration = { ...existingIntegration, [field]: value };
    
    handleConfigUpdate({
      integration: updatedIntegration,
      // Also sync webhook_url for backwards compatibility
      ...(integrationType === 'n8n' && field === 'webhook_url' ? { webhook_url: value } : {}),
    });
  };

  const activateIntegration = (integrationType: AIIntegrationType) => {
    const newIntegration = defaultIntegrations[integrationType];
    handleConfigUpdate({
      active_integration: integrationType,
      integration: { ...newIntegration, enabled: true },
      provider: integrationType === 'n8n' ? 'n8n' : integrationType === 'lovable' ? 'lovable' : 'custom',
    });
  };

  // Generate sample payload for preview
  const samplePayload = useMemo(() => {
    const payload: Record<string, unknown> = {
      message: "What services do you offer?",
      sessionId: "session_1234567890_abc123def",
    };

    if (hasContext && contextData) {
      payload.siteContext = contextData;
    }

    return payload;
  }, [hasContext, contextData]);

  const copyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(samplePayload, null, 2));
    toast({ title: 'Copied to clipboard' });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const activeIntegration = config?.active_integration || 'n8n';
  const currentIntegrationConfig = config?.integration || defaultIntegrations.n8n;

  // Check if an integration is properly configured
  // Note: For OpenAI/Gemini we show "Requires secret" since we can't check Supabase secrets from client
  const isIntegrationConfigured = (type: AIIntegrationType): boolean | 'requires_secret' => {
    switch (type) {
      case 'n8n': {
        const webhookUrl = config?.integration?.type === 'n8n' 
          ? (config.integration as N8nIntegration).webhook_url 
          : config?.webhook_url;
        return !!webhookUrl && webhookUrl.trim().length > 0;
      }
      case 'lovable':
        // Lovable is always configured (no API key needed)
        return true;
      case 'openai':
      case 'gemini':
        // These require Supabase secrets - we can't verify from client
        return 'requires_secret';
      case 'ollama': {
        // Check for base_url
        if (config?.integration?.type === 'ollama') {
          return !!(config.integration as any).base_url;
        }
        return false;
      }
      default:
        return false;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Integrations</h2>
          <p className="text-muted-foreground">
            Connect to external services and AI providers
          </p>
        </div>
      </div>

      {/* Integration Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {integrationsMeta.map((integration) => {
          const isActive = activeIntegration === integration.type;
          const isExpanded = expandedIntegration === integration.type;
          const isAvailable = integration.available;
          const isConfigured = isIntegrationConfigured(integration.type);
          
          return (
            <Card 
              key={integration.type}
              className={`relative transition-all ${isActive ? 'ring-2 ring-primary' : ''} ${!isAvailable ? 'opacity-60' : ''}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-muted ${integrationColors[integration.type]}`}>
                      {integrationIcons[integration.type]}
                    </div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {integration.name}
                        {isActive && (
                          <Badge variant="default" className="text-xs">
                            <Check className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {integration.description}
                      </CardDescription>
                    </div>
                  </div>
                </div>
                
                {/* Connection status indicator */}
                {isAvailable && (
                  <div className="mt-3">
                    {isConfigured === true ? (
                      <Badge variant="outline" className="text-xs text-green-600 border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800">
                        <Circle className="h-2 w-2 mr-1.5 fill-green-500 text-green-500" />
                        Connected
                      </Badge>
                    ) : isConfigured === 'requires_secret' ? (
                      <Badge variant="outline" className="text-xs text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800">
                        <Key className="h-3 w-3 mr-1" />
                        Requires secret
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Not configured
                      </Badge>
                    )}
                  </div>
                )}
              </CardHeader>
              
              <CardContent className="space-y-4">
                {!isAvailable ? (
                  <Badge variant="outline" className="text-xs">Coming soon</Badge>
                ) : (
                  <>
                    {/* Quick actions */}
                    <div className="flex gap-2">
                      {!isActive && (
                        <Button 
                          size="sm" 
                          onClick={() => activateIntegration(integration.type)}
                        >
                          Activate
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setExpandedIntegration(isExpanded ? null : integration.type)}
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        Configure
                        <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </Button>
                      {integration.docs && (
                        <Button size="sm" variant="ghost" asChild>
                          <a href={integration.docs} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      )}
                    </div>

                    {/* Expanded Configuration */}
                    {isExpanded && (
                      <div className="pt-4 border-t space-y-4">
                        {integration.type === 'n8n' && (
                          <N8nConfig
                            config={currentIntegrationConfig as N8nIntegration}
                            legacyWebhookUrl={config?.webhook_url}
                            onUpdate={(field, value) => handleIntegrationFieldUpdate('n8n', field, value)}
                          />
                        )}
                        
                        {integration.type === 'lovable' && (
                          <LovableConfig
                            config={currentIntegrationConfig as LovableIntegration}
                            onUpdate={(field, value) => handleIntegrationFieldUpdate('lovable', field, value)}
                          />
                        )}
                        
                        {integration.type === 'openai' && (
                          <OpenAIConfig
                            config={currentIntegrationConfig as OpenAIIntegration}
                            onUpdate={(field, value) => handleIntegrationFieldUpdate('openai', field, value)}
                          />
                        )}
                        
                        {integration.type === 'gemini' && (
                          <GeminiConfig
                            config={currentIntegrationConfig as GeminiIntegration}
                            onUpdate={(field, value) => handleIntegrationFieldUpdate('gemini', field, value)}
                          />
                        )}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Payload Preview - useful for n8n users */}
      <Card>
        <CardHeader>
          <Collapsible open={showPayloadPreview} onOpenChange={setShowPayloadPreview}>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer">
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Webhook Payload Preview
                </CardTitle>
                <ChevronDown className={`h-4 w-4 transition-transform ${showPayloadPreview ? 'rotate-180' : ''}`} />
              </div>
            </CollapsibleTrigger>
            <CardDescription>
              See the JSON structure sent to your webhook (useful for n8n setup)
            </CardDescription>
            <CollapsibleContent>
              <CardContent className="pt-4">
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={copyPayload}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                  <pre className="bg-muted/50 p-4 rounded-lg overflow-x-auto text-xs font-mono max-h-96 overflow-y-auto">
                    {JSON.stringify(samplePayload, null, 2)}
                  </pre>
                </div>
                {hasContext && (
                  <p className="text-xs text-muted-foreground mt-2">
                    ✓ Site context includes {contextData?.pages.length || 0} page(s) with {contextData?.pages.reduce((sum, p) => sum + p.blocks.length, 0) || 0} block(s) and {contextData?.blogs.length || 0} blog post(s)
                  </p>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </CardHeader>
      </Card>
    </div>
  );
};

// ============================================
// n8n Configuration Component
// ============================================
interface N8nConfigProps {
  config: N8nIntegration;
  legacyWebhookUrl?: string;
  onUpdate: (field: string, value: string) => void;
}

const N8nConfig: React.FC<N8nConfigProps> = ({ config, legacyWebhookUrl, onUpdate }) => {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Connect to an n8n workflow via webhook. Your n8n agent will receive chat messages along with site context.
      </p>
      <div className="space-y-2">
        <Label htmlFor="webhook_url">Webhook URL</Label>
        <Input
          id="webhook_url"
          type="url"
          value={config.webhook_url || legacyWebhookUrl || ''}
          onChange={(e) => onUpdate('webhook_url', e.target.value)}
          placeholder="https://your-n8n.example.com/webhook/ai-chat"
        />
        <p className="text-xs text-muted-foreground">
          Create a webhook trigger in n8n and paste the production URL here
        </p>
      </div>
    </div>
  );
};

// ============================================
// Lovable AI Configuration Component
// ============================================
interface LovableConfigProps {
  config: LovableIntegration;
  onUpdate: (field: string, value: string) => void;
}

const LovableConfig: React.FC<LovableConfigProps> = ({ config, onUpdate }) => {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Use Lovable's built-in AI gateway. No API key needed - powered by Gemini/GPT models.
      </p>
      <div className="space-y-2">
        <Label htmlFor="model">Model</Label>
        <select
          id="model"
          value={config.model || 'google/gemini-2.5-flash'}
          onChange={(e) => onUpdate('model', e.target.value)}
          className="w-full px-3 py-2 rounded-md border bg-background text-sm"
        >
          <option value="google/gemini-2.5-flash">Gemini 2.5 Flash (Fast)</option>
          <option value="google/gemini-2.5-pro">Gemini 2.5 Pro (Powerful)</option>
          <option value="openai/gpt-5-mini">GPT-5 Mini</option>
          <option value="openai/gpt-5">GPT-5</option>
        </select>
      </div>
    </div>
  );
};

// ============================================
// OpenAI Configuration Component
// ============================================
interface OpenAIConfigProps {
  config: OpenAIIntegration;
  onUpdate: (field: string, value: string) => void;
}

const OpenAIConfig: React.FC<OpenAIConfigProps> = ({ config, onUpdate }) => {
  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-2">
          <Key className="h-4 w-4 text-blue-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-900 dark:text-blue-100">API Key Required</p>
            <p className="text-blue-700 dark:text-blue-300 mt-1">
              Add your OpenAI API key as a Supabase secret named <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900 rounded text-xs font-mono">OPENAI_API_KEY</code>
            </p>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="openai_model">Model</Label>
        <select
          id="openai_model"
          value={config.model || 'gpt-4o'}
          onChange={(e) => onUpdate('model', e.target.value)}
          className="w-full px-3 py-2 rounded-md border bg-background text-sm"
        >
          <option value="gpt-4o">GPT-4o (Recommended)</option>
          <option value="gpt-4o-mini">GPT-4o Mini (Faster)</option>
          <option value="gpt-4-turbo">GPT-4 Turbo</option>
          <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Budget)</option>
        </select>
      </div>
    </div>
  );
};

// ============================================
// Gemini Configuration Component
// ============================================
interface GeminiConfigProps {
  config: GeminiIntegration;
  onUpdate: (field: string, value: string) => void;
}

const GeminiConfig: React.FC<GeminiConfigProps> = ({ config, onUpdate }) => {
  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-2">
          <Key className="h-4 w-4 text-blue-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-900 dark:text-blue-100">API Key Required</p>
            <p className="text-blue-700 dark:text-blue-300 mt-1">
              Add your Google AI API key as a Supabase secret named <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900 rounded text-xs font-mono">GEMINI_API_KEY</code>
            </p>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="gemini_model">Model</Label>
        <select
          id="gemini_model"
          value={config.model || 'gemini-1.5-flash'}
          onChange={(e) => onUpdate('model', e.target.value)}
          className="w-full px-3 py-2 rounded-md border bg-background text-sm"
        >
          <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast)</option>
          <option value="gemini-1.5-pro">Gemini 1.5 Pro (Powerful)</option>
          <option value="gemini-2.0-flash">Gemini 2.0 Flash (Latest)</option>
        </select>
      </div>
    </div>
  );
};

export default IntegrationsManager;
