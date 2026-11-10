// ============================================
// Integrations — grouped list with a detail panel
// (see docs/redesign/Integrations.dc.html). Each integration says what it
// does and what it powers, so it is clear what breaks if it stops working.
// ============================================

import React, { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Clock, FolderOpen, Eye, Search, Loader2, LayoutGrid, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useAIModule, useUpdateAIModule, useGitHubModule, useUpdateGitHubModule } from '@/models/modules';
import type {
  AIIntegrationType,
  N8nIntegration,
  OpenAIIntegration,
  GeminiIntegration,
  GarageAIIntegration,
  CustomIntegration,
  AIModuleConfig,
  GitHubModuleConfig,
} from '@/types/modules';
import { defaultIntegrations, defaultModuleConfigs } from '@/types/modules';
import { toast } from 'sonner';
import { AdminPageHeader } from './shell/AdminPageHeader';
import { Chip, Eyebrow, StatusPill, toneClasses, underlineTabs, type Tone } from './shell/primitives';
import { useGmailStatus, gmailStatusKey } from './integrations/useGmailStatus';
import { cn } from '@/lib/utils';

type IntegrationId = 'garageai' | 'openai' | 'gemini' | 'custom' | 'n8n' | 'github' | 'gmail' | 'resend' | 'firecrawl' | 'unsplash';
type Group = 'ai' | 'source' | 'tool';

interface IntegrationInfo {
  id: IntegrationId;
  group: Group;
  name: string;
  mono: string;
  what: string;
  powers: string;
  usedBy: string[];
  secret?: string;
  docs?: string;
}

const integrations: IntegrationInfo[] = [
  {
    id: 'garageai', group: 'ai', name: 'GarageAI', mono: 'GA',
    what: 'Private, self-hosted models. No per-token cost.',
    powers: 'chat · autopilot · cv tools · admin tools',
    usedBy: ['Magnet chat', 'Autopilot drafts', 'CV tools', 'Admin AI tools'],
    secret: 'GARAGEAI_API_KEY', docs: 'https://garageai.eu',
  },
  {
    id: 'openai', group: 'ai', name: 'OpenAI', mono: 'AI',
    what: 'GPT models answer visitors and write drafts.',
    powers: 'chat · autopilot · cv tools',
    usedBy: ['Magnet chat', 'Autopilot drafts', 'CV tools'],
    secret: 'OPENAI_API_KEY', docs: 'https://platform.openai.com/docs',
  },
  {
    id: 'gemini', group: 'ai', name: 'Google Gemini', mono: 'G',
    what: 'Alternative model provider, with tool calling.',
    powers: 'chat (alternative)',
    usedBy: ['Magnet chat'],
    secret: 'GEMINI_API_KEY', docs: 'https://ai.google.dev/docs',
  },
  {
    id: 'custom', group: 'ai', name: 'Self-hosted model', mono: '{ }',
    what: 'Any OpenAI-compatible endpoint, e.g. Ollama or vLLM.',
    powers: 'chat (private)',
    usedBy: ['Magnet chat'],
  },
  {
    id: 'n8n', group: 'ai', name: 'n8n workflow', mono: 'n8n',
    what: 'Hand the whole chat to an n8n agent via webhook.',
    powers: 'chat (custom)',
    usedBy: ['Magnet chat'],
    docs: 'https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/',
  },
  {
    id: 'github', group: 'source', name: 'GitHub', mono: 'GH',
    what: 'Repositories become project pages.',
    powers: '/github · case studies · mcp',
    usedBy: ['Projects', 'Project case studies', 'Magnet · project deep dive', 'MCP · projects_list'],
    secret: 'GITHUB_TOKEN', docs: 'https://docs.github.com/en/rest',
  },
  {
    id: 'gmail', group: 'source', name: 'Gmail signals', mono: 'M',
    what: 'Scans your inbox for leads and assignments.',
    powers: 'inbox scan · daily report',
    usedBy: ['Autopilot inbox digest', 'Daily report'],
    docs: 'https://developers.google.com/gmail/api',
  },
  {
    id: 'resend', group: 'tool', name: 'Resend', mono: 'R',
    what: 'Sends the newsletter and notification emails.',
    powers: 'newsletter · contact alerts',
    usedBy: ['Newsletter', 'Contact alerts'],
    secret: 'RESEND_API_KEY', docs: 'https://resend.com/docs',
  },
  {
    id: 'firecrawl', group: 'tool', name: 'Firecrawl', mono: 'FC',
    what: 'Reads web pages for research.',
    powers: 'autopilot research',
    usedBy: ['Autopilot research', 'Source scout'],
    secret: 'FIRECRAWL_API_KEY', docs: 'https://docs.firecrawl.dev',
  },
  {
    id: 'unsplash', group: 'tool', name: 'Unsplash', mono: 'U',
    what: 'Finds cover images for posts.',
    powers: 'blog editor',
    usedBy: ['Blog editor · cover images'],
    secret: 'UNSPLASH_ACCESS_KEY', docs: 'https://unsplash.com/developers',
  },
];

const groups: { id: Group; title: string; hint: string }[] = [
  { id: 'ai', title: 'AI models', hint: 'The brain behind the chat, the blog editor and the CV tools. One is the default; the others are alternatives.' },
  { id: 'source', title: 'Content sources', hint: 'Where content and signals come from.' },
  { id: 'tool', title: 'Tools', hint: 'Helpers the agents call when they need them.' },
];

type Status = { label: string; tone: Tone; detail?: string };

// Starts the Gmail OAuth flow: the edge function (admin only) issues a
// one-time state and returns the Google consent URL. The popup is opened
// synchronously so popup blockers allow it, then pointed at Google.
async function startGmailConnect() {
  const popup = window.open('', '_blank', 'width=600,height=700');
  const { data, error } = await supabase.functions.invoke('gmail-oauth-callback', {
    body: { action: 'authorize' },
  });
  if (error || !data?.url) {
    popup?.close();
    toast.error('Could not start Gmail connection');
    return;
  }
  if (popup) popup.location.href = data.url;
  else window.location.href = data.url;
}

const IntegrationsManager: React.FC = () => {
  const { config, isLoading } = useAIModule();
  const { data: githubModule, config: githubConfig } = useGitHubModule();
  const updateModule = useUpdateAIModule();
  const updateGitHubModule = useUpdateGitHubModule();
  const { data: gmailStatus } = useGmailStatus();
  const [filter, setFilter] = useState<'all' | Group>('all');
  const [selected, setSelected] = useState<IntegrationId | null>(null);

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
    const current = config?.integration?.type === integrationType ? config.integration : defaultIntegrations[integrationType];
    handleConfigUpdate({
      active_integration: integrationType,
      integration: { ...current, enabled: true },
      provider: integrationType === 'n8n' ? 'n8n' : integrationType === 'lovable' ? 'lovable' : 'custom',
    });
  }, [config, handleConfigUpdate]);

  const activeIntegration = config?.active_integration || 'n8n';
  const integrationConfigFor = <T,>(type: AIIntegrationType): T =>
    (config?.integration?.type === type ? config.integration : defaultIntegrations[type]) as T;

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

  const statusOf = useCallback((id: IntegrationId): Status => {
    switch (id) {
      case 'garageai':
      case 'openai':
      case 'gemini':
      case 'custom':
      case 'n8n': {
        if (activeIntegration === id) {
          const model = (config?.integration as { model?: string } | undefined)?.model;
          return { label: 'Active · default', tone: 'accent', detail: model ? `Default for Magnet · ${model}` : 'Default for Magnet' };
        }
        if (id === 'custom' && config?.integration?.type === 'custom' && (config.integration as CustomIntegration).base_url) {
          return { label: 'Configured', tone: 'neutral' };
        }
        if (id === 'n8n' && config?.webhook_url) return { label: 'Configured', tone: 'neutral' };
        return { label: id === 'openai' || id === 'gemini' || id === 'garageai' ? 'Available' : 'Not set up', tone: 'neutral' };
      }
      case 'github':
        if (githubModule?.enabled && githubConfig?.username) {
          return { label: 'Connected', tone: 'success', detail: `Connected · @${githubConfig.username}` };
        }
        return githubConfig?.username
          ? { label: 'Switched off', tone: 'neutral' }
          : { label: 'Not set up', tone: 'neutral' };
      case 'gmail':
        if (gmailStatus?.needs_reconnect) {
          return { label: 'Reconnect needed', tone: 'warning', detail: 'Access expired · scans have stopped' };
        }
        if (gmailStatus?.connected) {
          return { label: 'Connected', tone: 'success', detail: gmailStatus.email ? `Connected · ${gmailStatus.email}` : 'Connected' };
        }
        return { label: 'Not set up', tone: 'neutral' };
      default:
        return { label: 'Available', tone: 'neutral', detail: 'Uses a key stored on the server' };
    }
  }, [activeIntegration, config, githubModule, githubConfig, gmailStatus]);

  const actionOf = (id: IntegrationId, status: Status): { label: string; primary?: boolean } => {
    if (status.tone === 'warning') return { label: 'Reconnect', primary: true };
    if (status.tone === 'accent') return { label: 'Configure' };
    if (status.tone === 'success') return { label: 'Manage' };
    if (id === 'gmail') return { label: 'Connect' };
    return { label: integrations.find((i) => i.id === id)?.group === 'tool' ? 'Details' : 'Set up' };
  };

  const counts = useMemo(() => {
    const all = integrations.map((i) => statusOf(i.id));
    return {
      connected: all.filter((s) => s.tone === 'success' || s.tone === 'accent').length,
      attention: all.filter((s) => s.tone === 'warning' || s.tone === 'danger').length,
      available: all.filter((s) => s.tone === 'neutral').length,
    };
  }, [statusOf]);

  const fallbackSelected =
    integrations.find((i) => ['warning', 'danger'].includes(statusOf(i.id).tone))?.id ??
    integrations.find((i) => i.id === activeIntegration)?.id ??
    'garageai';
  const current = integrations.find((i) => i.id === (selected ?? fallbackSelected))!;
  const currentStatus = statusOf(current.id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  const renderSettings = () => {
    switch (current.id) {
      case 'n8n':
        return (
          <N8nConfig
            config={integrationConfigFor<N8nIntegration>('n8n')}
            legacyWebhookUrl={config?.webhook_url}
            onUpdate={(field, value) => handleIntegrationFieldUpdate('n8n', field, value)}
          />
        );
      case 'garageai':
        return (
          <GarageAIConfig
            config={integrationConfigFor<GarageAIIntegration>('garageai')}
            onUpdate={(field, value) => handleIntegrationFieldUpdate('garageai', field, value)}
          />
        );
      case 'openai':
        return (
          <OpenAIConfig
            config={integrationConfigFor<OpenAIIntegration>('openai')}
            onUpdate={(field, value) => handleIntegrationFieldUpdate('openai', field, value)}
          />
        );
      case 'gemini':
        return (
          <GeminiConfig
            config={integrationConfigFor<GeminiIntegration>('gemini')}
            onUpdate={(field, value) => handleIntegrationFieldUpdate('gemini', field, value)}
          />
        );
      case 'custom':
        return (
          <CustomConfig
            config={integrationConfigFor<CustomIntegration>('custom')}
            onUpdate={(field, value) => handleIntegrationFieldUpdate('custom', field, value)}
          />
        );
      case 'firecrawl':
        return <FirecrawlConfig />;
      case 'resend':
        return <ResendConfig />;
      case 'unsplash':
        return <UnsplashConfig />;
      case 'github':
        return (
          <GitHubSourceConfig
            config={githubConfig}
            enabled={githubModule?.enabled ?? false}
            onConfigUpdate={handleGitHubConfigUpdate}
            onToggle={toggleGitHubIntegration}
          />
        );
      case 'gmail':
        return (
          <GmailSourceConfig
            connected={gmailStatus?.connected ?? false}
            needsReconnect={!!gmailStatus?.needs_reconnect}
            email={gmailStatus?.email ?? null}
            connectedAt={gmailStatus?.connected_at ?? null}
          />
        );
    }
  };

  const isAI = current.group === 'ai';

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Integrations"
        description="External services the site and Magnet talk to. Each one says what it powers, so you know what breaks if it stops working."
        actions={
          <>
            <span className={cn('inline-flex h-[26px] items-center rounded-full px-2.5 text-[12.5px] font-medium', toneClasses.success.pill)}>
              {counts.connected} connected
            </span>
            {counts.attention > 0 && (
              <span className={cn('inline-flex h-[26px] items-center rounded-full px-2.5 text-[12.5px] font-medium', toneClasses.warning.pill)}>
                {counts.attention} needs attention
              </span>
            )}
            <span className={cn('inline-flex h-[26px] items-center rounded-full px-2.5 text-[12.5px] font-medium', toneClasses.neutral.pill)}>
              {counts.available} available
            </span>
          </>
        }
      />

      <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | Group)}>
        <TabsList className={underlineTabs.list}>
          <TabsTrigger value="all" className={underlineTabs.trigger}>All</TabsTrigger>
          {groups.map((g) => (
            <TabsTrigger key={g.id} value={g.id} className={underlineTabs.trigger}>{g.title}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-[3] flex-col gap-6">
          {groups
            .filter((g) => filter === 'all' || filter === g.id)
            .map((g) => (
              <section key={g.id} className="space-y-2.5">
                <div>
                  <h2 className="text-sm font-semibold">{g.title}</h2>
                  <p className="mt-0.5 text-[12.5px] text-muted-foreground">{g.hint}</p>
                </div>
                <div className="overflow-hidden rounded-xl border border-border">
                  {integrations
                    .filter((i) => i.group === g.id)
                    .map((it, idx) => {
                      const st = statusOf(it.id);
                      const action = actionOf(it.id, st);
                      const isSelected = it.id === current.id;
                      return (
                        <div
                          key={it.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelected(it.id)}
                          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setSelected(it.id))}
                          className={cn(
                            'flex cursor-pointer items-center gap-3.5 px-4 py-3.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                            idx > 0 && 'border-t border-border/70',
                            isSelected ? 'bg-muted/50' : 'bg-card hover:bg-muted/30',
                          )}
                        >
                          <span
                            aria-hidden="true"
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-[13px] font-bold text-foreground/80"
                          >
                            {it.mono}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold">{it.name}</span>
                              <StatusPill tone={st.tone}>{st.label}</StatusPill>
                            </div>
                            <p className="mt-0.5 text-[12.5px] text-muted-foreground">{it.what}</p>
                            <p className="mt-1.5 text-xs text-foreground/80">
                              Powers: <span className="font-mono text-[11.5px]">{it.powers}</span>
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant={action.primary ? 'default' : 'outline'}
                            className="h-8 shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelected(it.id);
                              if (it.id === 'gmail' && action.label !== 'Manage') startGmailConnect();
                            }}
                          >
                            {action.label}
                          </Button>
                        </div>
                      );
                    })}
                </div>
              </section>
            ))}
        </div>

        <aside
          aria-labelledby="integration-detail"
          className="min-w-0 flex-[2] overflow-hidden rounded-xl border border-border bg-card lg:sticky lg:top-[72px]"
        >
          <div className="flex items-center gap-3 border-b border-border p-[18px]">
            <span
              aria-hidden="true"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-primary text-sm font-bold text-primary-foreground"
            >
              {current.mono}
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="integration-detail" className="text-base font-semibold">{current.name}</h2>
              <p className={cn('mt-0.5 text-[12.5px] font-medium', toneClasses[currentStatus.tone].text)}>
                {currentStatus.detail ?? currentStatus.label}
              </p>
            </div>
            {selected && (
              <button
                type="button"
                aria-label="Close"
                onClick={() => setSelected(null)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="space-y-5 p-[18px]">
            <div>
              <Eyebrow className="mb-1.5">What it does</Eyebrow>
              <p className="text-[13.5px] leading-relaxed text-foreground/80">{current.what}</p>
            </div>
            <div>
              <Eyebrow className="mb-2">Used by</Eyebrow>
              <div className="flex flex-wrap gap-1.5">
                {current.usedBy.map((u) => (
                  <Chip key={u} className="h-6 rounded-md px-2 text-xs">{u}</Chip>
                ))}
              </div>
            </div>
            <div>
              <Eyebrow className="mb-3">Settings</Eyebrow>
              {renderSettings()}
            </div>
            {isAI && activeIntegration !== current.id && (
              <Button size="sm" onClick={() => activateIntegration(current.id as AIIntegrationType)}>
                Make {current.name} the default
              </Button>
            )}
            {current.secret && (
              <div className="rounded-lg border border-border/70 bg-muted/40 p-3 text-[12.5px] text-foreground/80">
                <strong className="font-semibold">Secret:</strong>{' '}
                <span className="font-mono text-xs">{current.secret}</span> is stored with the Supabase functions, never in the
                browser. Set or rotate it there.
              </div>
            )}
            {current.docs && (
              <a href={current.docs} target="_blank" rel="noreferrer" className="inline-block text-[13px] font-medium text-ring hover:underline">
                Documentation ↗
              </a>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

// ============================================
// Config forms (rendered in the detail panel)
// ============================================

const selectClass = 'h-9 w-full rounded-md border border-input bg-background px-3 text-sm';

const FirecrawlConfig: React.FC = () => (
  <div className="space-y-2 text-[13px] text-foreground/80">
    <p>Autopilot calls it when it needs the text of a web page:</p>
    <ul className="list-inside list-disc space-y-0.5 text-[12.5px] text-muted-foreground">
      <li>Scrape — the content of one URL</li>
      <li>Search — a web search with the pages extracted</li>
      <li>Map and crawl — every page on a site</li>
    </ul>
  </div>
);

const ResendConfig: React.FC = () => {
  const [fromEmail, setFromEmail] = React.useState(() => {
    try {
      return localStorage.getItem('resend_from_email') || 'newsletter@froste.eu';
    } catch {
      return 'newsletter@froste.eu';
    }
  });

  return (
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
        <Button
          onClick={() => {
            try {
              localStorage.setItem('resend_from_email', fromEmail);
              toast.success('Saved');
            } catch {
              toast.error('Could not save in this browser');
            }
          }}
          size="sm"
          className="h-9"
        >
          Save
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Must belong to a domain verified in Resend.</p>
    </div>
  );
};

const UnsplashConfig: React.FC = () => (
  <p className="text-[13px] text-foreground/80">
    Search Unsplash from the blog editor to set a cover image. Nothing to configure here.
  </p>
);

const N8nConfig: React.FC<{ config: N8nIntegration; legacyWebhookUrl?: string; onUpdate: (field: string, value: string) => void }> = ({ config, legacyWebhookUrl, onUpdate }) => (
  <div className="space-y-2">
    <Label htmlFor="webhook_url">Webhook URL</Label>
    <Input
      id="webhook_url"
      type="url"
      defaultValue={config.webhook_url || legacyWebhookUrl || ''}
      onBlur={(e) => onUpdate('webhook_url', e.target.value)}
      placeholder="https://your-n8n.example.com/webhook/ai-chat"
    />
    <p className="text-xs text-muted-foreground">Saved when you leave the field. The whole chat is handed to this workflow.</p>
  </div>
);

const OpenAIConfig: React.FC<{ config: OpenAIIntegration; onUpdate: (field: string, value: string) => void }> = ({ config, onUpdate }) => (
  <div className="space-y-2">
    <Label htmlFor="openai_model">Model</Label>
    <select
      id="openai_model"
      value={config.model || 'gpt-4o'}
      onChange={(e) => onUpdate('model', e.target.value)}
      className={selectClass}
    >
      <option value="gpt-4o">GPT-4o (recommended)</option>
      <option value="gpt-4o-mini">GPT-4o mini (faster)</option>
      <option value="gpt-4-turbo">GPT-4 Turbo</option>
    </select>
  </div>
);

const GeminiConfig: React.FC<{ config: GeminiIntegration; onUpdate: (field: string, value: string) => void }> = ({ config, onUpdate }) => (
  <div className="space-y-2">
    <Label htmlFor="gemini_model">Model</Label>
    <select
      id="gemini_model"
      value={config.model || 'gemini-1.5-flash'}
      onChange={(e) => onUpdate('model', e.target.value)}
      className={selectClass}
    >
      <option value="gemini-1.5-flash">Gemini 1.5 Flash (fast)</option>
      <option value="gemini-1.5-pro">Gemini 1.5 Pro (powerful)</option>
      <option value="gemini-2.0-flash">Gemini 2.0 Flash (latest)</option>
    </select>
  </div>
);

const GarageAIConfig: React.FC<{ config: GarageAIIntegration; onUpdate: (field: string, value: string) => void }> = ({ config, onUpdate }) => (
  <div className="space-y-2">
    <Label htmlFor="garageai_model">Model</Label>
    <Input
      id="garageai_model"
      defaultValue={config.model || 'garageai/auto'}
      onBlur={(e) => onUpdate('model', e.target.value || 'garageai/auto')}
      placeholder="garageai/auto"
      className="font-mono"
    />
    <p className="text-xs text-muted-foreground">
      garageai/auto picks a model per request. Autopilot, CV tools and planning also use GarageAI whenever the
      GARAGEAI_API_KEY secret is set. Cover images and PDF parsing still use the Lovable gateway.
    </p>
  </div>
);

const CustomConfig: React.FC<{ config: CustomIntegration; onUpdate: (field: string, value: string) => void }> = ({ config, onUpdate }) => (
  <div className="space-y-3">
    <div className="space-y-1.5">
      <Label htmlFor="custom_base_url">Base URL</Label>
      <Input
        id="custom_base_url"
        type="url"
        defaultValue={config.base_url || ''}
        onBlur={(e) => onUpdate('base_url', e.target.value)}
        placeholder="https://ollama.example.com/v1"
      />
    </div>
    <div className="space-y-1.5">
      <Label htmlFor="custom_model">Model</Label>
      <Input
        id="custom_model"
        defaultValue={config.model || ''}
        onBlur={(e) => onUpdate('model', e.target.value)}
        placeholder="llama3.1:8b"
        className="font-mono"
      />
    </div>
    <p className="text-xs text-muted-foreground">Saved when you leave a field. The endpoint must speak the OpenAI chat API.</p>
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
            onClick={() => setSearchParams({ tab: 'projects', section: 'repos' })}
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
  needsReconnect: boolean;
  email: string | null;
  connectedAt: string | null;
}> = ({ connected, needsReconnect, email, connectedAt }) => {
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
      queryClient.invalidateQueries({ queryKey: gmailStatusKey });
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
        {needsReconnect ? (
          <div className="rounded-lg border border-border bg-warning-soft p-3">
            <p className="text-sm font-medium text-warning">Access expired</p>
            <p className="mt-1 text-xs text-foreground/80">
              Google no longer accepts the stored token{email ? ` for ${email}` : ''}, so inbox scans have stopped. Reconnect to resume.
            </p>
            <Button size="sm" className="mt-2 h-8" onClick={startGmailConnect}>Reconnect Gmail</Button>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-sm font-medium">Connected{email ? ` as ${email}` : ''}</p>
            {connectedAt && <p className="mt-1 text-xs text-muted-foreground">Since {new Date(connectedAt).toLocaleDateString()}</p>}
          </div>
        )}

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
      <p className="text-[13px] text-foreground/80">Connect Gmail to harvest signals from LinkedIn, newsletters and updates.</p>
      <Button size="sm" onClick={startGmailConnect}>
        Connect Gmail
      </Button>
    </div>
  );
};

export default IntegrationsManager;
