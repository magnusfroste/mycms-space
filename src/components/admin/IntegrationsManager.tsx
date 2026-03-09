// ============================================
// Integrations Manager
// List view with slide-in detail sheet
// ============================================

import React, { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Webhook, Bot, Sparkles, Server, Check, ExternalLink, Settings,
  Circle, AlertCircle, Key, Globe, Mail, Github, LayoutGrid, Clock,
  FolderOpen, Eye, Search, Loader2, ImageIcon, Network, Wifi, WifiOff,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useAIModule, useUpdateAIModule, useGitHubModule, useUpdateGitHubModule } from '@/models/modules';
import type {
  AIIntegrationType, UtilityIntegrationType, SourceIntegrationType,
  N8nIntegration, LovableIntegration, OpenAIIntegration, GeminiIntegration,
  AIModuleConfig, IntegrationMeta, ResendIntegration, GitHubModuleConfig,
} from '@/types/modules';
import { integrationsMeta, defaultIntegrations, defaultModuleConfigs } from '@/types/modules';
import { toast } from 'sonner';

import IntegrationListItem from './integrations/IntegrationListItem';
import IntegrationDetailSheet from './integrations/IntegrationDetailSheet';
import type { IntegrationStatus } from './integrations/IntegrationListItem';

type IntegrationType = AIIntegrationType | UtilityIntegrationType | SourceIntegrationType;

// Icons & colors
const integrationIcons: Record<IntegrationType, React.ReactNode> = {
  n8n: <Webhook className="h-5 w-5" />,
  lovable: <Sparkles className="h-5 w-5" />,
  openai: <Bot className="h-5 w-5" />,
  gemini: <Sparkles className="h-5 w-5" />,
  custom: <Server className="h-5 w-5" />,
  firecrawl: <Globe className="h-5 w-5" />,
  resend: <Mail className="h-5 w-5" />,
  github: <Github className="h-5 w-5" />,
  gmail: <Mail className="h-5 w-5" />,
  unsplash: <ImageIcon className="h-5 w-5" />,
};

const integrationColors: Record<IntegrationType, string> = {
  n8n: 'text-orange-500',
  lovable: 'text-pink-500',
  openai: 'text-green-500',
  gemini: 'text-blue-500',
  custom: 'text-purple-500',
  firecrawl: 'text-amber-500',
  resend: 'text-indigo-500',
  github: 'text-gray-700 dark:text-gray-300',
  gmail: 'text-red-500',
  unsplash: 'text-slate-700 dark:text-slate-300',
};

const categoryLabels: Record<string, string> = {
  ai: 'AI Providers',
  utility: 'Utilities',
  source: 'Sources',
};

const IntegrationsManager: React.FC = () => {
  const { data: module, config, isLoading } = useAIModule();
  const { data: githubModule, config: githubConfig } = useGitHubModule();
  const updateModule = useUpdateAIModule();
  const updateGitHubModule = useUpdateGitHubModule();
  const [selectedType, setSelectedType] = useState<IntegrationType | null>(null);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const { data: gmailStatus } = useQuery({
    queryKey: ['gmail-status'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('gmail-oauth-callback', {
        body: { action: 'status' },
      });
      if (error) return { connected: false, email: null, connected_at: null };
      return data as { connected: boolean; email: string | null; connected_at: string | null };
    },
  });

  const handleConfigUpdate = useCallback((updates: Partial<AIModuleConfig>) => {
    if (!config) return;
    updateModule.mutate(
      { module_config: { ...config, ...updates } },
      {
        onSuccess: () => toast.success('Saved'),
        onError: () => toast.error('Error saving'),
      }
    );
  }, [config, updateModule]);

  const handleIntegrationFieldUpdate = useCallback((integrationType: AIIntegrationType, field: string, value: string) => {
    if (!config) return;
    const existingIntegration = config.integration?.type === integrationType
      ? config.integration
      : defaultIntegrations[integrationType];
    const updatedIntegration = { ...existingIntegration, [field]: value };
    handleConfigUpdate({
      integration: updatedIntegration,
      ...(integrationType === 'n8n' && field === 'webhook_url' ? { webhook_url: value } : {}),
    });
  }, [config, handleConfigUpdate]);

  const activateIntegration = useCallback((integrationType: AIIntegrationType) => {
    const newIntegration = defaultIntegrations[integrationType];
    handleConfigUpdate({
      active_integration: integrationType,
      integration: { ...newIntegration, enabled: true },
      provider: integrationType === 'n8n' ? 'n8n' : integrationType === 'lovable' ? 'lovable' : 'custom',
    });
  }, [handleConfigUpdate]);

  const activeIntegration = config?.active_integration || 'n8n';
  const currentIntegrationConfig = config?.integration || defaultIntegrations.n8n;

  const isIntegrationConfigured = useCallback((type: IntegrationType): IntegrationStatus => {
    switch (type) {
      case 'n8n': {
        const webhookUrl = config?.integration?.type === 'n8n'
          ? (config.integration as N8nIntegration).webhook_url
          : config?.webhook_url;
        return !!webhookUrl && webhookUrl.trim().length > 0;
      }
      case 'lovable': return false;
      case 'openai':
      case 'gemini':
        return activeIntegration === type ? 'connected' : true;
      case 'firecrawl':
      case 'resend':
      case 'unsplash':
        return 'connected';
      case 'github':
        return !!(githubModule?.enabled && githubConfig?.username);
      case 'gmail':
        return gmailStatus?.connected ? 'connected' : false;
      case 'custom': {
        if (config?.integration?.type === 'custom') {
          return !!(config.integration as any).base_url;
        }
        return false;
      }
      default: return false;
    }
  }, [config, activeIntegration, githubModule, githubConfig, gmailStatus]);

  const isAIIntegration = (type: IntegrationType): type is AIIntegrationType =>
    ['n8n', 'lovable', 'openai', 'gemini', 'custom'].includes(type);

  const toggleGitHubIntegration = useCallback((enabled: boolean) => {
    updateGitHubModule.mutate(
      { enabled },
      {
        onSuccess: () => toast.success(enabled ? 'GitHub enabled' : 'GitHub disabled'),
        onError: () => toast.error('Error saving'),
      }
    );
  }, [updateGitHubModule]);

  const handleGitHubConfigUpdate = useCallback(<K extends keyof GitHubModuleConfig>(
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
  }, [githubConfig, updateGitHubModule]);

  // Filter integrations
  const filteredIntegrations = React.useMemo(() => {
    let results = integrationsMeta;
    if (activeCategory !== 'all') {
      results = results.filter(i => i.category === activeCategory);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      results = results.filter(i =>
        i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)
      );
    }
    return results;
  }, [query, activeCategory]);

  // Group by category
  const grouped = React.useMemo(() => {
    const groups: Record<string, IntegrationMeta[]> = {};
    for (const cat of ['ai', 'utility', 'source']) {
      const entries = filteredIntegrations.filter(i => i.category === cat);
      if (entries.length > 0) groups[cat] = entries;
    }
    return groups;
  }, [filteredIntegrations]);

  const selectedIntegration = selectedType
    ? integrationsMeta.find(i => i.type === selectedType) ?? null
    : null;

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Integrations</h2>
          <p className="text-muted-foreground text-sm">
            Connect to external services and AI providers
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search integrations…"
          className="pl-9 pr-9"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <span className="sr-only">Clear</span>×
          </button>
        )}
      </div>

      {/* Category tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
          {['ai', 'utility', 'source'].map(cat => (
            <TabsTrigger key={cat} value={cat} className="text-xs">
              {categoryLabels[cat]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Integration list */}
      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No integrations match your search</p>
        </div>
      ) : (
        Object.entries(grouped).map(([cat, entries]) => (
          <div key={cat}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              {categoryLabels[cat]}
            </h3>
            <div className="space-y-1.5">
              {entries.map(integration => {
                const isActive = integration.category === 'ai'
                  ? activeIntegration === integration.type
                  : (integration.type === 'github' && githubModule?.enabled) || (integration.type === 'gmail' && gmailStatus?.connected);

                return (
                  <IntegrationListItem
                    key={integration.type}
                    name={integration.name}
                    description={integration.description}
                    icon={integrationIcons[integration.type]}
                    iconColor={integrationColors[integration.type]}
                    isActive={!!isActive}
                    isAvailable={integration.available}
                    isConfigured={isIntegrationConfigured(integration.type)}
                    onClick={() => setSelectedType(integration.type)}
                  />
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* Detail Sheet */}
      {selectedIntegration && (
        <IntegrationDetailSheet
          open={!!selectedType}
          onClose={() => setSelectedType(null)}
          name={selectedIntegration.name}
          description={selectedIntegration.description}
          icon={integrationIcons[selectedIntegration.type]}
          iconColor={integrationColors[selectedIntegration.type]}
          isActive={
            selectedIntegration.category === 'ai'
              ? activeIntegration === selectedIntegration.type
              : (selectedIntegration.type === 'github' && !!githubModule?.enabled) ||
                (selectedIntegration.type === 'gmail' && !!gmailStatus?.connected)
          }
          isAvailable={selectedIntegration.available}
          isConfigured={isIntegrationConfigured(selectedIntegration.type)}
          showActivate={
            isAIIntegration(selectedIntegration.type) ||
            (selectedIntegration.type === 'github' && !githubModule?.enabled) ||
            (selectedIntegration.type === 'gmail' && !gmailStatus?.connected)
          }
          onActivate={() => {
            if (isAIIntegration(selectedIntegration.type)) {
              activateIntegration(selectedIntegration.type);
            } else if (selectedIntegration.type === 'github') {
              toggleGitHubIntegration(true);
            } else if (selectedIntegration.type === 'gmail') {
              const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gmail-oauth-callback?action=authorize`;
              window.open(url, '_blank', 'width=600,height=700');
            }
          }}
        >
          {/* AI Provider configs */}
          {selectedType === 'n8n' && (
            <N8nConfig
              config={currentIntegrationConfig as N8nIntegration}
              legacyWebhookUrl={config?.webhook_url}
              onUpdate={(field, value) => handleIntegrationFieldUpdate('n8n', field, value)}
            />
          )}
          {selectedType === 'lovable' && (
            <LovableConfig
              config={currentIntegrationConfig as LovableIntegration}
              onUpdate={(field, value) => handleIntegrationFieldUpdate('lovable', field, value)}
            />
          )}
          {selectedType === 'openai' && (
            <OpenAIConfig
              config={currentIntegrationConfig as OpenAIIntegration}
              onUpdate={(field, value) => handleIntegrationFieldUpdate('openai', field, value)}
            />
          )}
          {selectedType === 'gemini' && (
            <GeminiConfig
              config={currentIntegrationConfig as GeminiIntegration}
              onUpdate={(field, value) => handleIntegrationFieldUpdate('gemini', field, value)}
            />
          )}
          {/* Utility configs */}
          {selectedType === 'firecrawl' && <FirecrawlConfig />}
          {selectedType === 'resend' && <ResendConfig />}
          {selectedType === 'unsplash' && <UnsplashConfig />}
          {/* Source configs */}
          {selectedType === 'github' && (
            <GitHubSourceConfig
              config={githubConfig}
              enabled={githubModule?.enabled ?? false}
              onConfigUpdate={handleGitHubConfigUpdate}
              onToggle={toggleGitHubIntegration}
            />
          )}
          {selectedType === 'gmail' && (
            <GmailSourceConfig
              connected={gmailStatus?.connected ?? false}
              email={gmailStatus?.email ?? null}
              connectedAt={gmailStatus?.connected_at ?? null}
            />
          )}
        </IntegrationDetailSheet>
      )}
    </div>
  );
};

// ============================================
// Config sub-components (kept from original)
// ============================================

const FirecrawlConfig: React.FC = () => (
  <div className="space-y-4">
    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
      <div className="flex items-start gap-2">
        <Check className="h-4 w-4 text-green-600 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-green-900 dark:text-green-100">Connected via Connector</p>
          <p className="text-green-700 dark:text-green-300 mt-1">
            API key <code className="px-1 py-0.5 bg-green-100 dark:bg-green-900 rounded text-xs font-mono">FIRECRAWL_API_KEY</code> is automatically available.
          </p>
        </div>
      </div>
    </div>
    <div className="text-sm text-muted-foreground">
      <p className="font-medium mb-2">Features:</p>
      <ul className="list-disc list-inside space-y-1 text-xs">
        <li>Scrape — Extract content from any URL</li>
        <li>Search — Web search with extraction</li>
        <li>Map — Discover all URLs on a site</li>
        <li>Crawl — Recursively scrape entire sites</li>
      </ul>
    </div>
  </div>
);

const ResendConfig: React.FC = () => {
  const [fromEmail, setFromEmail] = React.useState(() =>
    localStorage.getItem('resend_from_email') || 'newsletter@froste.eu'
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="resend_from_email">From address</Label>
        <div className="flex gap-2">
          <Input
            id="resend_from_email"
            type="email"
            value={fromEmail}
            onChange={(e) => setFromEmail(e.target.value)}
            placeholder="newsletter@example.com"
          />
          <Button onClick={() => { localStorage.setItem('resend_from_email', fromEmail); toast.success('Saved'); }} size="sm">Save</Button>
        </div>
        <p className="text-xs text-muted-foreground">Must belong to a verified domain in Resend.</p>
      </div>
      <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-2">
          <Key className="h-4 w-4 text-blue-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-900 dark:text-blue-100">API Key</p>
            <p className="text-blue-700 dark:text-blue-300 mt-1">
              Configured via <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900 rounded text-xs font-mono">RESEND_API_KEY</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const UnsplashConfig: React.FC = () => (
  <div className="space-y-4">
    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
      <div className="flex items-start gap-2">
        <Check className="h-4 w-4 text-green-600 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-green-900 dark:text-green-100">Connected</p>
          <p className="text-green-700 dark:text-green-300 mt-1">
            Via <code className="px-1 py-0.5 bg-green-100 dark:bg-green-900 rounded text-xs font-mono">UNSPLASH_ACCESS_KEY</code>
          </p>
        </div>
      </div>
    </div>
    <div className="text-sm text-muted-foreground">
      <p className="font-medium mb-1">Used in:</p>
      <p className="text-xs">Blog Editor — Search and set cover images</p>
    </div>
  </div>
);

const N8nConfig: React.FC<{ config: N8nIntegration; legacyWebhookUrl?: string; onUpdate: (field: string, value: string) => void }> = ({ config, legacyWebhookUrl, onUpdate }) => (
  <div className="space-y-4">
    <p className="text-sm text-muted-foreground">Connect to an n8n workflow via webhook.</p>
    <div className="space-y-2">
      <Label htmlFor="webhook_url">Webhook URL</Label>
      <Input
        id="webhook_url"
        type="url"
        value={config.webhook_url || legacyWebhookUrl || ''}
        onChange={(e) => onUpdate('webhook_url', e.target.value)}
        placeholder="https://your-n8n.example.com/webhook/ai-chat"
      />
    </div>
  </div>
);

const LovableConfig: React.FC<{ config: LovableIntegration; onUpdate: (field: string, value: string) => void }> = ({ config, onUpdate }) => (
  <div className="space-y-4">
    <p className="text-sm text-muted-foreground">Built-in AI gateway. No API key needed.</p>
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

const OpenAIConfig: React.FC<{ config: OpenAIIntegration; onUpdate: (field: string, value: string) => void }> = ({ config, onUpdate }) => (
  <div className="space-y-4">
    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
      <div className="flex items-start gap-2">
        <Key className="h-4 w-4 text-blue-600 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-blue-900 dark:text-blue-100">API Key</p>
          <p className="text-blue-700 dark:text-blue-300 mt-1">
            Secret <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900 rounded text-xs font-mono">OPENAI_API_KEY</code>
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
      </select>
    </div>
  </div>
);

const GeminiConfig: React.FC<{ config: GeminiIntegration; onUpdate: (field: string, value: string) => void }> = ({ config, onUpdate }) => (
  <div className="space-y-4">
    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
      <div className="flex items-start gap-2">
        <Key className="h-4 w-4 text-blue-600 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-blue-900 dark:text-blue-100">API Key</p>
          <p className="text-blue-700 dark:text-blue-300 mt-1">
            Secret <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900 rounded text-xs font-mono">GEMINI_API_KEY</code>
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

// ============================================
// GitHub Source Configuration
// ============================================
const GitHubSourceConfig: React.FC<{
  config: GitHubModuleConfig | undefined;
  enabled: boolean;
  onConfigUpdate: <K extends keyof GitHubModuleConfig>(field: K, value: GitHubModuleConfig[K]) => void;
  onToggle: (enabled: boolean) => void;
}> = ({ config, enabled, onConfigUpdate, onToggle }) => {
  const defaultConfig = defaultModuleConfigs.github;
  const currentConfig = config ?? defaultConfig;
  const [localUsername, setLocalUsername] = React.useState(currentConfig.username);
  const [, setSearchParams] = useSearchParams();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <Label>Enable GitHub</Label>
          <p className="text-xs text-muted-foreground">Show GitHub content in pages</p>
        </div>
        <Switch checked={enabled} onCheckedChange={onToggle} />
      </div>

      <div className="space-y-2">
        <Label>Username</Label>
        <div className="flex gap-2">
          <Input
            value={localUsername}
            onChange={(e) => setLocalUsername(e.target.value)}
            placeholder="magnusfroste"
          />
          <Button onClick={() => onConfigUpdate('username', localUsername)} size="sm">Save</Button>
        </div>
      </div>

      {enabled && currentConfig.username && (
        <>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => setSearchParams({ tab: 'github-repos' })}
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            Manage Repositories
          </Button>

          {/* Cache */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Cache</span>
            </div>
            <Label htmlFor="cache_dur">Duration (minutes)</Label>
            <Input
              id="cache_dur"
              type="number"
              min={5}
              max={1440}
              value={currentConfig.cache_duration_minutes}
              onChange={(e) => onConfigUpdate('cache_duration_minutes', parseInt(e.target.value) || 60)}
            />
          </div>

          {/* Filters */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <LayoutGrid className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Sync Filters</span>
            </div>
            <div className="flex items-center justify-between">
              <Label>Hide Forked</Label>
              <Switch checked={currentConfig.hide_forked ?? true} onCheckedChange={(c) => onConfigUpdate('hide_forked', c)} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Hide Archived</Label>
              <Switch checked={currentConfig.hide_archived ?? true} onCheckedChange={(c) => onConfigUpdate('hide_archived', c)} />
            </div>
          </div>

          {/* Display */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Display Defaults</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(['show_stars', 'show_forks', 'show_languages', 'show_topics'] as const).map(field => (
                <div key={field} className="flex items-center justify-between">
                  <Label className="text-xs capitalize">{field.replace('show_', '')}</Label>
                  <Switch
                    checked={currentConfig[field] ?? true}
                    onCheckedChange={(c) => onConfigUpdate(field, c)}
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ============================================
// Gmail Source Config
// ============================================
interface GmailStatusData {
  connected: boolean;
  email: string | null;
  connected_at: string | null;
  filter_senders: string[];
  filter_labels: string[];
  max_messages: number;
  scan_days: number;
  last_scan: { scanned_at: string; signal_count: number } | null;
}

interface ScanSignal { from: string; subject: string; date: string }

const GmailSourceConfig: React.FC<{
  connected: boolean;
  email: string | null;
  connectedAt: string | null;
}> = ({ connected, email, connectedAt }) => {
  const queryClient = useQueryClient();
  const [disconnecting, setDisconnecting] = React.useState(false);
  const [scanning, setScanning] = React.useState(false);
  const [scanSignals, setScanSignals] = React.useState<ScanSignal[]>([]);

  const { data: fullStatus } = useQuery({
    queryKey: ['gmail-status-full'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('gmail-oauth-callback', { body: { action: 'status' } });
      if (error) return null;
      return data as GmailStatusData;
    },
    enabled: connected,
  });

  const [senderInput, setSenderInput] = React.useState('');
  const [localSenders, setLocalSenders] = React.useState<string[]>([]);
  const [localScanDays, setLocalScanDays] = React.useState(7);
  const [localMaxMessages, setLocalMaxMessages] = React.useState(20);
  const [settingsDirty, setSettingsDirty] = React.useState(false);

  React.useEffect(() => {
    if (fullStatus) {
      setLocalSenders(fullStatus.filter_senders || []);
      setLocalScanDays(fullStatus.scan_days || 7);
      setLocalMaxMessages(fullStatus.max_messages || 20);
      setSettingsDirty(false);
    }
  }, [fullStatus]);

  const handleSaveSettings = async () => {
    try {
      await supabase.functions.invoke('gmail-oauth-callback', {
        body: { action: 'update_settings', filter_senders: localSenders, scan_days: localScanDays, max_messages: localMaxMessages },
      });
      queryClient.invalidateQueries({ queryKey: ['gmail-status-full'] });
      setSettingsDirty(false);
      toast.success('Settings saved');
    } catch { toast.error('Failed to save'); }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await supabase.functions.invoke('gmail-oauth-callback', { body: { action: 'disconnect' } });
      queryClient.invalidateQueries({ queryKey: ['gmail-status'] });
      queryClient.invalidateQueries({ queryKey: ['gmail-status-full'] });
      toast.success('Gmail disconnected');
    } catch { toast.error('Failed to disconnect'); }
    finally { setDisconnecting(false); }
  };

  const handleScan = async () => {
    setScanning(true);
    setScanSignals([]);
    try {
      toast.info('Scanning inbox...');
      const { data, error } = await supabase.functions.invoke('agent-inbox-scan', { body: { action: 'scan' } });
      if (error) throw error;
      setScanSignals(data.signals || []);
      queryClient.invalidateQueries({ queryKey: ['gmail-status-full'] });
      toast.success(`Scan complete: ${data.signalCount} signals`);
    } catch (e) {
      toast.error('Scan failed');
    } finally { setScanning(false); }
  };

  if (connected) {
    return (
      <div className="space-y-5">
        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
          <p className="text-sm font-medium text-green-800 dark:text-green-200">Connected</p>
          {email && <p className="text-xs text-green-600 dark:text-green-400 mt-1">{email}</p>}
          {connectedAt && <p className="text-xs text-muted-foreground mt-1">Since {new Date(connectedAt).toLocaleDateString()}</p>}
        </div>

        {/* Filters */}
        <div className="border-t pt-4 space-y-3">
          <span className="text-sm font-medium">Scan Filters</span>
          <div className="space-y-2">
            <Label>Filter by Sender</Label>
            <div className="flex gap-2">
              <Input
                value={senderInput}
                onChange={(e) => setSenderInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const t = senderInput.trim(); if (t && !localSenders.includes(t)) { setLocalSenders([...localSenders, t]); setSenderInput(''); setSettingsDirty(true); } } }}
                placeholder="e.g. notifications@linkedin.com"
                className="text-sm"
              />
              <Button size="sm" variant="outline" onClick={() => { const t = senderInput.trim(); if (t && !localSenders.includes(t)) { setLocalSenders([...localSenders, t]); setSenderInput(''); setSettingsDirty(true); } }}>Add</Button>
            </div>
            {localSenders.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {localSenders.map(s => (
                  <Badge key={s} variant="secondary" className="text-xs gap-1 pr-1">
                    {s}
                    <button onClick={() => { setLocalSenders(localSenders.filter(x => x !== s)); setSettingsDirty(true); }} className="ml-1 hover:text-destructive">×</button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Period (days)</Label>
              <Input type="number" min={1} max={90} value={localScanDays} onChange={(e) => { setLocalScanDays(parseInt(e.target.value) || 7); setSettingsDirty(true); }} className="text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Max messages</Label>
              <Input type="number" min={1} max={100} value={localMaxMessages} onChange={(e) => { setLocalMaxMessages(parseInt(e.target.value) || 20); setSettingsDirty(true); }} className="text-sm" />
            </div>
          </div>

          {settingsDirty && <Button size="sm" onClick={handleSaveSettings}>Save Settings</Button>}
        </div>

        <div className="flex gap-2 border-t pt-4">
          <Button size="sm" variant="outline" onClick={handleScan} disabled={scanning}>
            {scanning ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Search className="h-3 w-3 mr-1" />}
            Scan Now
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDisconnect} disabled={disconnecting}>
            {disconnecting && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
            Disconnect
          </Button>
        </div>

        {scanSignals.length > 0 && (
          <div className="border-t pt-4 space-y-2">
            <span className="text-sm font-medium">Scanned Signals ({scanSignals.length})</span>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">From</th>
                    <th className="px-3 py-2 text-left font-medium">Subject</th>
                    <th className="px-3 py-2 text-left font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {scanSignals.map((sig, i) => (
                    <tr key={i} className="hover:bg-muted/30">
                      <td className="px-3 py-2 max-w-[120px] truncate">{sig.from}</td>
                      <td className="px-3 py-2 max-w-[160px] truncate">{sig.subject}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{sig.date ? new Date(sig.date).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!scanSignals.length && fullStatus?.last_scan && (
          <div className="text-xs text-muted-foreground border-t pt-3">
            Last scan: {new Date(fullStatus.last_scan.scanned_at).toLocaleString()} · {fullStatus.last_scan.signal_count} signals
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Connect Gmail to harvest signals from LinkedIn, newsletters, and updates.</p>
      <Button size="sm" onClick={() => {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gmail-oauth-callback?action=authorize`;
        window.open(url, '_blank', 'width=600,height=700');
      }}>
        Connect Gmail
      </Button>
    </div>
  );
};

export default IntegrationsManager;
