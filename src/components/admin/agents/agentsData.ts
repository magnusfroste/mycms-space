// ============================================
// Data for Operators (MCP keys) and Autopilot (automations, tasks, guardrails)
// ============================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MCP_ENDPOINT } from '@/components/admin/shell/nav';

/** Ready-to-paste MCP client config (Claude Desktop, Cursor, Hermes …). */
export const mcpClientConfig = (key = 'YOUR_MCP_KEY') => `{
  "mcpServers": {
    "mycms": {
      "url": "${MCP_ENDPOINT}",
      "headers": { "Authorization": "Bearer ${key}" }
    }
  }
}`;

export const MCP_SCOPES = [
  {
    id: 'read',
    label: 'Read',
    help: 'Read everything, including private knowledge, the inbox and analytics.',
  },
  {
    id: 'content',
    label: 'Content',
    help: 'Create and update the knowledge base, blog, pages, projects and newsletter drafts.',
  },
  {
    id: 'review',
    label: 'Review',
    help: 'Approve or reject Autopilot work, publish posts and send newsletters.',
  },
  {
    id: 'settings',
    label: 'Settings',
    help: 'Change site settings, modules, navigation and automations.',
  },
] as const;

export type McpScope = (typeof MCP_SCOPES)[number]['id'];

/** Legacy scopes: `tools:call` meant everything, `tools:read` meant read. */
export const effectiveScopes = (scopes: string[] | null | undefined): McpScope[] => {
  const set = new Set<McpScope>();
  for (const s of scopes ?? []) {
    if (s === 'tools:call') MCP_SCOPES.forEach((x) => set.add(x.id));
    else if (s === 'tools:read') set.add('read');
    else if (MCP_SCOPES.some((x) => x.id === s)) set.add(s as McpScope);
  }
  return MCP_SCOPES.map((x) => x.id).filter((id) => set.has(id));
};

export type Operator = {
  id: string;
  name: string;
  key_prefix: string;
  description: string | null;
  scopes: McpScope[];
  revoked: boolean;
  expires_at: string | null;
  created_at: string;
  last_used_at: string | null;
  lastCall: string | null;
  calls30d: number;
};

export const operatorKeys = { all: ['mcp-keys'] as const };

export function useOperators() {
  return useQuery({
    queryKey: [...operatorKeys.all, 'with-activity'],
    queryFn: async (): Promise<Operator[]> => {
      const since = new Date(Date.now() - 30 * 86400_000).toISOString();
      const [keys, acts] = await Promise.all([
        supabase
          .from('mcp_api_keys')
          .select('id, name, key_prefix, description, scopes, revoked, expires_at, created_at, last_used_at')
          .order('created_at', { ascending: true }),
        supabase
          .from('mcp_activities')
          .select('api_key_id, key_name, created_at')
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(5000),
      ]);
      if (keys.error) throw keys.error;
      const activity = acts.data ?? [];
      return (keys.data ?? []).map((k) => {
        const mine = activity.filter((a) => a.api_key_id === k.id || (!a.api_key_id && a.key_name === k.name));
        const lastCall = mine[0]?.created_at ?? k.last_used_at ?? null;
        return {
          ...k,
          scopes: effectiveScopes(k.scopes),
          lastCall: lastCall && k.last_used_at && k.last_used_at > lastCall ? k.last_used_at : lastCall,
          calls30d: mine.length,
        };
      });
    },
    refetchInterval: 60_000,
  });
}

const invokeKeys = async (body: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke('mcp-keys', { body });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as { key?: string; name?: string };
};

export function useCreateOperatorKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { name: string; scopes: McpScope[]; description?: string }) =>
      invokeKeys({ action: 'create', name: p.name, scopes: p.scopes, description: p.description || null }),
    onSuccess: () => qc.invalidateQueries({ queryKey: operatorKeys.all }),
  });
}

export function useRevokeOperatorKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (key_id: string) => invokeKeys({ action: 'revoke', key_id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: operatorKeys.all }),
  });
}

export function useRotateOperatorKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (key_id: string) => invokeKeys({ action: 'rotate', key_id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: operatorKeys.all }),
  });
}

// ─── Autopilot ────────────────────────────────────────────────────────────────

export function useAutopilotStats() {
  return useQuery({
    queryKey: ['agent-tasks', 'autopilot-stats'],
    queryFn: async () => {
      const head = { count: 'exact' as const, head: true };
      const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString();
      const [waiting, failed, failed7, completed, waitingRows] = await Promise.all([
        supabase.from('agent_tasks').select('id', head).eq('status', 'needs_review'),
        supabase.from('agent_tasks').select('id', head).eq('status', 'failed'),
        supabase.from('agent_tasks').select('id', head).eq('status', 'failed').gte('created_at', weekAgo),
        supabase.from('agent_tasks').select('id', head).eq('status', 'completed'),
        supabase.from('agent_tasks').select('task_type').eq('status', 'needs_review').limit(1000),
      ]);
      const byType: Record<string, number> = {};
      for (const r of waitingRows.data ?? []) byType[r.task_type] = (byType[r.task_type] ?? 0) + 1;
      return {
        waiting: waiting.count ?? 0,
        failed: failed.count ?? 0,
        failed7d: failed7.count ?? 0,
        completed: completed.count ?? 0,
        waitingByType: byType,
      };
    },
    refetchInterval: 60_000,
  });
}

export type AutopilotGuardrails = {
  max_waiting_reviews: number;
  draft_expiry_days: number;
  /** Publish blog drafts that score at least auto_publish_min_score without review. */
  auto_publish: boolean;
  auto_publish_min_score: number;
};

const GUARDRAIL_DEFAULTS: AutopilotGuardrails = {
  max_waiting_reviews: 5,
  draft_expiry_days: 14,
  auto_publish: false,
  auto_publish_min_score: 8,
};

/** Guardrails live in modules.autopilot.module_config (read by agent-autopilot/guardrails.ts). */
export function useAutopilotGuardrails() {
  return useQuery({
    queryKey: ['modules', 'autopilot'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('modules')
        .select('id, module_config')
        .eq('module_type', 'autopilot')
        .maybeSingle();
      if (error) throw error;
      const c = (data?.module_config ?? {}) as Record<string, unknown>;
      return {
        exists: !!data,
        config: c,
        guardrails: {
          max_waiting_reviews: Number(c.max_waiting_reviews) || GUARDRAIL_DEFAULTS.max_waiting_reviews,
          draft_expiry_days: Number(c.draft_expiry_days) || GUARDRAIL_DEFAULTS.draft_expiry_days,
          auto_publish: c.auto_publish === true,
          auto_publish_min_score: Number(c.auto_publish_min_score) || GUARDRAIL_DEFAULTS.auto_publish_min_score,
        } as AutopilotGuardrails,
      };
    },
  });
}

export function useSaveAutopilotGuardrails() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ guardrails, current, exists }: { guardrails: AutopilotGuardrails; current: Record<string, unknown>; exists: boolean }) => {
      const module_config = { ...current, ...guardrails };
      const { error } = exists
        ? await supabase.from('modules').update({ module_config } as never).eq('module_type', 'autopilot')
        : await supabase.from('modules').insert({ module_type: 'autopilot', module_config, enabled: true } as never);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['modules', 'autopilot'] }),
  });
}

// ─── Human words for automation triggers ─────────────────────────────────────

const DAYS = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];
const pad = (n: string) => n.padStart(2, '0');

/** Turns the common cron shapes into plain words; falls back to the expression. */
export function cronToWords(expr: string | undefined | null): string {
  if (!expr) return 'No schedule set';
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return expr;
  const [min, hour, dom, mon, dow] = parts;
  const isNum = (v: string) => /^\d+$/.test(v);
  const time = isNum(min) && isNum(hour) ? `${pad(hour)}:${pad(min)}` : null;
  if (min.startsWith('*/') && hour === '*' && dom === '*' && mon === '*' && dow === '*') return `Every ${min.slice(2)} min`;
  if (isNum(min) && hour === '*' && dom === '*' && dow === '*') return 'Hourly';
  if (isNum(min) && hour.startsWith('*/') && dom === '*' && dow === '*') return `Every ${hour.slice(2)} h`;
  if (time && dom === '*' && mon === '*' && dow === '*') return `Daily ${time}`;
  if (time && dom === '*' && mon === '*' && isNum(dow)) return `${DAYS[Number(dow) % 7]} ${time}`;
  if (time && dom === '*' && mon === '*' && dow === '1-5') return `Weekdays ${time}`;
  if (time && isNum(dom) && mon === '*' && dow === '*') return `Monthly on day ${dom}, ${time}`;
  return expr;
}

const eventWords: Record<string, string> = {
  'contact.created': 'New message',
  'contact_message.created': 'New message',
  'newsletter.subscribed': 'New subscriber',
  'subscriber.created': 'New subscriber',
  'blog.published': 'Post published',
  'github.synced': 'After GitHub sync',
  // Names written by the create_cms_signal() DB trigger
  contact_received: 'New message',
  subscriber_added: 'New subscriber',
  blog_published: 'Post published',
};

export function triggerToWords(type: string, config: Record<string, unknown> | null | undefined): string {
  const c = config ?? {};
  if (type === 'cron') return cronToWords((c.expression as string) || (c.schedule as string) || (c.cron as string));
  if (type === 'event') {
    const name = (c.event_name as string) || (c.event as string) || '';
    return eventWords[name] ?? (name ? `On ${name}` : 'On event');
  }
  if (type === 'signal') {
    const name = (c.event_name as string) || '';
    return eventWords[name] ?? 'When a signal arrives';
  }
  return type;
}
