// ============================================
// Integrations Manager
// Catalog of available integrations (n8n, OpenAI, etc.)
// All integration settings consolidated here (n8n pattern)
// ============================================

import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Webhook, Bot, Sparkles, Server, Check, ExternalLink, Settings, ChevronDown, Circle, AlertCircle, Key, Globe, Mail, Github, LayoutGrid, Clock, FolderOpen, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { Switch } from '@/components/ui/switch';

import { useAIModule, useUpdateAIModule, useGitHubModule, useUpdateGitHubModule } from '@/models/modules';

import type { AIIntegrationType, UtilityIntegrationType, SourceIntegrationType, N8nIntegration, LovableIntegration, OpenAIIntegration, GeminiIntegration, AIModuleConfig, IntegrationMeta, ResendIntegration, GitHubModuleConfig } from '@/types/modules';
import { integrationsMeta, defaultIntegrations, defaultModuleConfigs } from '@/types/modules';

// Combined integration type (all categories)
type IntegrationType = AIIntegrationType | UtilityIntegrationType | SourceIntegrationType;

// Secret names for each integration
const integrationSecrets: Partial<Record<IntegrationType, string>> = {
  openai: 'OPENAI_API_KEY',
  gemini: 'GEMINI_API_KEY',
  firecrawl: 'FIRECRAWL_API_KEY',
};
import { toast } from 'sonner';

// Integration icons
const integrationIcons: Record<IntegrationType, React.ReactNode> = {
  n8n: <Webhook className="h-5 w-5" />,
  lovable: <Sparkles className="h-5 w-5" />,
  openai: <Bot className="h-5 w-5" />,
  gemini: <Sparkles className="h-5 w-5" />,
  ollama: <Server className="h-5 w-5" />,
  firecrawl: <Globe className="h-5 w-5" />,
  resend: <Mail className="h-5 w-5" />,
  github: <Github className="h-5 w-5" />,
};

const integrationColors: Record<IntegrationType, string> = {
  n8n: 'text-orange-500',
  lovable: 'text-pink-500',
  openai: 'text-green-500',
  gemini: 'text-blue-500',
  ollama: 'text-purple-500',
  firecrawl: 'text-amber-500',
  resend: 'text-indigo-500',
  github: 'text-gray-700 dark:text-gray-300',
};

const IntegrationsManager: React.FC = () => {
  const { data: module, config, isLoading } = useAIModule();
  const { data: githubModule, config: githubConfig } = useGitHubModule();
  const updateModule = useUpdateAIModule();
  const updateGitHubModule = useUpdateGitHubModule();
  const [expandedIntegration, setExpandedIntegration] = useState<IntegrationType | null>(null);

  const handleConfigUpdate = (updates: Partial<AIModuleConfig>) => {
    if (!config) return;
    updateModule.mutate(
      { module_config: { ...config, ...updates } },
      {
        onSuccess: () => toast.success('Saved'),
        onError: () => toast.error('Error saving'),
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
  const isIntegrationConfigured = (type: IntegrationType): boolean | 'requires_secret' | 'connected' => {
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
      case 'firecrawl':
      case 'resend':
        // These are connected via secrets/connectors - verified externally
        return 'connected';
      case 'resend':
        // Resend requires RESEND_API_KEY secret
        return 'requires_secret';
      case 'github':
        // GitHub is configured if username is set and module is enabled
        return !!(githubModule?.enabled && githubConfig?.username);
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

  // Check if this is an AI integration (can be activated for chat)
  const isAIIntegration = (type: IntegrationType): type is AIIntegrationType => {
    return ['n8n', 'lovable', 'openai', 'gemini', 'ollama'].includes(type);
  };

  // Toggle GitHub integration
  const toggleGitHubIntegration = (enabled: boolean) => {
    updateGitHubModule.mutate(
      { enabled },
      {
        onSuccess: () => toast.success(enabled ? 'GitHub enabled' : 'GitHub disabled'),
        onError: () => toast.error('Error saving'),
      }
    );
  };

  // Update GitHub config field
  const handleGitHubConfigUpdate = <K extends keyof GitHubModuleConfig>(
    field: K,
    value: GitHubModuleConfig[K]
  ) => {
    const currentConfig = githubConfig ?? defaultModuleConfigs.github;
    updateGitHubModule.mutate(
      { module_config: { ...currentConfig, [field]: value } },
      {
        onSuccess: () => toast.success('Saved'),
        onError: () => toast.error('Error saving'),
      }
    );
  };

  // Legacy: updateGitHubUsername is now handled by handleGitHubConfigUpdate
  const updateGitHubUsername = (username: string) => {
    if (!githubConfig) return;
    updateGitHubModule.mutate(
      { module_config: { ...githubConfig, username } },
      {
        onSuccess: () => toast.success('Saved'),
        onError: () => toast.error('Error saving'),
      }
    );
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

      {/* AI Integrations Section */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-muted-foreground">AI Providers</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {integrationsMeta.filter(i => i.category === 'ai').map((integration) => {
            const isActive = activeIntegration === integration.type;
            const isExpanded = expandedIntegration === integration.type;
            const isAvailable = integration.available;
            const isConfigured = isIntegrationConfigured(integration.type);
            
            return (
              <IntegrationCard
                key={integration.type}
                integration={integration}
                isActive={isActive}
                isExpanded={isExpanded}
                isAvailable={isAvailable}
                isConfigured={isConfigured}
                onActivate={() => isAIIntegration(integration.type) && activateIntegration(integration.type)}
                onToggleExpand={() => setExpandedIntegration(isExpanded ? null : integration.type)}
                showActivate={isAIIntegration(integration.type)}
              >
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
              </IntegrationCard>
            );
          })}
        </div>
      </div>

      {/* Utility Integrations Section */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-muted-foreground">Utilities</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {integrationsMeta.filter(i => i.category === 'utility').map((integration) => {
            const isExpanded = expandedIntegration === integration.type;
            const isAvailable = integration.available;
            const isConfigured = isIntegrationConfigured(integration.type);
            
            return (
              <IntegrationCard
                key={integration.type}
                integration={integration}
                isActive={false}
                isExpanded={isExpanded}
                isAvailable={isAvailable}
                isConfigured={isConfigured}
                onActivate={() => {}}
                onToggleExpand={() => setExpandedIntegration(isExpanded ? null : integration.type)}
                showActivate={false}
              >
                {integration.type === 'firecrawl' && <FirecrawlConfig />}
                {integration.type === 'resend' && <ResendConfig />}
              </IntegrationCard>
            );
          })}
        </div>
      </div>

      {/* Source Integrations Section (GitHub, etc.) */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-muted-foreground">Sources</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {integrationsMeta.filter(i => i.category === 'source').map((integration) => {
            const isExpanded = expandedIntegration === integration.type;
            const isAvailable = integration.available;
            const isConfigured = isIntegrationConfigured(integration.type);
            const isActive = integration.type === 'github' && githubModule?.enabled;
            
            return (
              <IntegrationCard
                key={integration.type}
                integration={integration}
                isActive={isActive}
                isExpanded={isExpanded}
                isAvailable={isAvailable}
                isConfigured={isConfigured}
                onActivate={() => {
                  if (integration.type === 'github') {
                    toggleGitHubIntegration(true);
                    setExpandedIntegration('github');
                  }
                }}
                onToggleExpand={() => setExpandedIntegration(isExpanded ? null : integration.type)}
                showActivate={integration.type === 'github' && !githubModule?.enabled}
              >
                {integration.type === 'github' && (
                  <GitHubSourceConfig 
                    config={githubConfig}
                    enabled={githubModule?.enabled ?? false}
                    onConfigUpdate={handleGitHubConfigUpdate}
                    onToggle={toggleGitHubIntegration}
                  />
                )}
              </IntegrationCard>
            );
          })}
        </div>
      </div>

    </div>
  );
};

// ============================================
// Integration Card Component (Reusable)
// ============================================
interface IntegrationCardProps {
  integration: IntegrationMeta;
  isActive: boolean;
  isExpanded: boolean;
  isAvailable: boolean;
  isConfigured: boolean | 'requires_secret' | 'connected';
  onActivate: () => void;
  onToggleExpand: () => void;
  showActivate: boolean;
  children?: React.ReactNode;
}

const IntegrationCard: React.FC<IntegrationCardProps> = ({
  integration,
  isActive,
  isExpanded,
  isAvailable,
  isConfigured,
  onActivate,
  onToggleExpand,
  showActivate,
  children,
}) => {
  return (
    <Card className={`relative transition-all ${isActive ? 'ring-2 ring-primary' : ''} ${!isAvailable ? 'opacity-60' : ''}`}>
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
            {isConfigured === true || isConfigured === 'connected' ? (
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
              {showActivate && !isActive && (
                <Button size="sm" onClick={onActivate}>
                  Activate
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={onToggleExpand}>
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
                {children}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

// ============================================
// Firecrawl Configuration Component
// ============================================
const FirecrawlConfig: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
        <div className="flex items-start gap-2">
          <Check className="h-4 w-4 text-green-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-green-900 dark:text-green-100">Connected via Connector</p>
            <p className="text-green-700 dark:text-green-300 mt-1">
              Firecrawl is connected via Lovable connector. The API key <code className="px-1 py-0.5 bg-green-100 dark:bg-green-900 rounded text-xs font-mono">FIRECRAWL_API_KEY</code> is automatically available in edge functions.
            </p>
          </div>
        </div>
      </div>
      <div className="text-sm text-muted-foreground">
        <p className="font-medium mb-2">Available features:</p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Scrape</strong> - Extract content from any URL</li>
          <li><strong>Search</strong> - Web search with content extraction</li>
          <li><strong>Map</strong> - Discover all URLs on a website</li>
          <li><strong>Crawl</strong> - Recursively scrape entire sites</li>
        </ul>
      </div>
    </div>
  );
};

// ============================================
// Resend Configuration Component
// ============================================
const ResendConfig: React.FC = () => {
  const [fromEmail, setFromEmail] = React.useState(() => 
    localStorage.getItem('resend_from_email') || 'newsletter@froste.eu'
  );

  const handleSave = () => {
    localStorage.setItem('resend_from_email', fromEmail);
    toast.success('From-adress sparad');
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="resend_from_email">From-adress</Label>
        <div className="flex gap-2">
          <Input
            id="resend_from_email"
            type="email"
            value={fromEmail}
            onChange={(e) => setFromEmail(e.target.value)}
            placeholder="newsletter@example.com"
          />
          <Button onClick={handleSave} size="sm">Spara</Button>
        </div>
        <p className="text-xs text-muted-foreground">
          E-postadressen som nyhetsbrev skickas från. Måste tillhöra en verifierad domän i Resend.
        </p>
      </div>

      <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-2">
          <Key className="h-4 w-4 text-blue-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-900 dark:text-blue-100">API Key</p>
            <p className="text-blue-700 dark:text-blue-300 mt-1">
              Konfigurerad via secret <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900 rounded text-xs font-mono">RESEND_API_KEY</code>
            </p>
          </div>
        </div>
      </div>
      
      <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-900 dark:text-amber-100">⚠️ Viktigt: Verifiera din domän</p>
            <p className="text-amber-700 dark:text-amber-300 mt-1">
              From-adressen måste tillhöra en verifierad domän i Resend.
            </p>
            <a 
              href="https://resend.com/domains" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-amber-800 dark:text-amber-200 underline mt-2 hover:text-amber-900"
            >
              Verifiera domän i Resend
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        <p className="font-medium mb-2">Används för:</p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Newsletter</strong> - Skicka nyhetsbrev till prenumeranter</li>
          <li><strong>Transaktionella e-post</strong> - Bekräftelser, notiser</li>
        </ul>
      </div>
    </div>
  );
};


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

// ============================================
// GitHub Source Configuration Component (All-in-one)
// ============================================
interface GitHubSourceConfigProps {
  config: GitHubModuleConfig | undefined;
  enabled: boolean;
  onConfigUpdate: <K extends keyof GitHubModuleConfig>(field: K, value: GitHubModuleConfig[K]) => void;
  onToggle: (enabled: boolean) => void;
}


const GitHubSourceConfig: React.FC<GitHubSourceConfigProps> = ({ 
  config,
  enabled,
  onConfigUpdate,
  onToggle 
}) => {
  const defaultConfig = defaultModuleConfigs.github;
  const currentConfig = config ?? defaultConfig;
  const [localUsername, setLocalUsername] = React.useState(currentConfig.username);

  const handleSaveUsername = () => {
    onConfigUpdate('username', localUsername);
  };

  return (
    <div className="space-y-6">
      {/* Enable/Disable */}
      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="github_enabled">Enable GitHub Integration</Label>
          <p className="text-xs text-muted-foreground">
            Show GitHub content in your pages
          </p>
        </div>
        <Switch
          id="github_enabled"
          checked={enabled}
          onCheckedChange={onToggle}
        />
      </div>

      {/* Username */}
      <div className="space-y-2">
        <Label htmlFor="github_username">GitHub Username</Label>
        <div className="flex gap-2">
          <Input
            id="github_username"
            value={localUsername}
            onChange={(e) => setLocalUsername(e.target.value)}
            placeholder="magnusfroste"
          />
          <Button onClick={handleSaveUsername} size="sm">Save</Button>
        </div>
      </div>

      {enabled && currentConfig.username && (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-green-900 dark:text-green-100">Connected</p>
                <p className="text-green-700 dark:text-green-300 mt-1">
                  Fetching repos from <code className="px-1 py-0.5 bg-green-100 dark:bg-green-900 rounded text-xs font-mono">github.com/{currentConfig.username}</code>
                </p>
              </div>
            </div>
          </div>
          
          {/* Link to Repos Manager */}
          <ManageReposLink />
        </div>
      )}

      {/* Technical Settings - only show when enabled */}
      {enabled && (
        <>
          {/* Cache Settings */}
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Cache</span>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cache_duration">Cache Duration (minutes)</Label>
              <Input
                id="cache_duration"
                type="number"
                min={5}
                max={1440}
                value={currentConfig.cache_duration_minutes}
                onChange={(e) => onConfigUpdate('cache_duration_minutes', parseInt(e.target.value) || 60)}
              />
              <p className="text-xs text-muted-foreground">
                How long to cache GitHub API responses
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-4">
              <LayoutGrid className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Sync Filters</span>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="hide_forked">Hide Forked Repos</Label>
                  <p className="text-xs text-muted-foreground">Don't sync forked repositories</p>
                </div>
                <Switch
                  id="hide_forked"
                  checked={currentConfig.hide_forked ?? true}
                  onCheckedChange={(checked) => onConfigUpdate('hide_forked', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="hide_archived">Hide Archived Repos</Label>
                  <p className="text-xs text-muted-foreground">Don't sync archived repositories</p>
                </div>
                <Switch
                  id="hide_archived"
                  checked={currentConfig.hide_archived ?? true}
                  onCheckedChange={(checked) => onConfigUpdate('hide_archived', checked)}
                />
              </div>
            </div>
          </div>

          {/* Global Display Defaults */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Default Display Options</span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              These are global defaults. You can override them per block in the page builder.
            </p>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="show_stars">Stars</Label>
                <Switch
                  id="show_stars"
                  checked={currentConfig.show_stars ?? true}
                  onCheckedChange={(checked) => onConfigUpdate('show_stars', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="show_forks">Forks</Label>
                <Switch
                  id="show_forks"
                  checked={currentConfig.show_forks ?? true}
                  onCheckedChange={(checked) => onConfigUpdate('show_forks', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="show_languages">Languages</Label>
                <Switch
                  id="show_languages"
                  checked={currentConfig.show_languages ?? true}
                  onCheckedChange={(checked) => onConfigUpdate('show_languages', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="show_topics">Topics</Label>
                <Switch
                  id="show_topics"
                  checked={currentConfig.show_topics ?? true}
                  onCheckedChange={(checked) => onConfigUpdate('show_topics', checked)}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ============================================
// Manage Repos Link Component
// ============================================
const ManageReposLink: React.FC = () => {
  const [, setSearchParams] = useSearchParams();

  const handleClick = () => {
    setSearchParams({ tab: 'github-repos' });
  };

  return (
    <Button variant="outline" className="w-full justify-start" onClick={handleClick}>
      <FolderOpen className="h-4 w-4 mr-2" />
      Manage Repositories
      <span className="ml-auto text-xs text-muted-foreground">Select & enrich repos</span>
    </Button>
  );
};

export default IntegrationsManager;
