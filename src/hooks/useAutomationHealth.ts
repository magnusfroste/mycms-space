import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { AgentAutomation, AgentActivity } from '@/types/agent';

export interface AutomationHealthItem {
  id: string;
  name: string;
  triggerType: string;
  skillName: string | null;
  enabled: boolean;
  runCount: number;
  lastTriggeredAt: string | null;
  lastError: string | null;
  errorRate: number;
  dailyRuns: number[];
  dailyErrors: number[];
  health: 'healthy' | 'warning' | 'error' | 'stale' | 'disabled';
}

export interface AutomationHealthData {
  items: AutomationHealthItem[];
  total: number;
  enabled: number;
  healthy: number;
  warning: number;
  erroring: number;
  totalRuns7d: number;
  overallErrorRate: number;
}

function deriveHealth(item: { enabled: boolean; runCount: number; errorRate: number; lastTriggeredAt: string | null }): AutomationHealthItem['health'] {
  if (!item.enabled) return 'disabled';
  if (item.errorRate > 0.3) return 'error';
  if (item.errorRate > 0.1) return 'warning';
  if (item.runCount === 0) return 'stale';
  if (item.lastTriggeredAt) {
    const daysSince = (Date.now() - new Date(item.lastTriggeredAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince > 7) return 'stale';
  }
  return 'healthy';
}

export function useAutomationHealth() {
  return useQuery({
    queryKey: ['automation-health'],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 7);

      const [{ data: automations }, { data: activities }] = await Promise.all([
        supabase.from('agent_automations').select('*').order('created_at', { ascending: false }),
        supabase.from('agent_activity').select('*').gte('created_at', since.toISOString()).order('created_at', { ascending: false }).limit(500),
      ]);

      const autos = (automations || []) as unknown as AgentAutomation[];
      const acts = (activities || []) as unknown as AgentActivity[];

      // Build daily buckets (7 days)
      const dayBuckets = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().slice(0, 10);
      });

      const items: AutomationHealthItem[] = autos.map((auto) => {
        const skillActs = acts.filter(a => a.skill_name === auto.skill_name);
        const errors = skillActs.filter(a => a.status === 'failed');
        const errorRate = skillActs.length > 0 ? errors.length / skillActs.length : 0;

        const dailyRuns = dayBuckets.map(day => skillActs.filter(a => a.created_at.slice(0, 10) === day).length);
        const dailyErrors = dayBuckets.map(day => errors.filter(a => a.created_at.slice(0, 10) === day).length);

        const item = {
          id: auto.id,
          name: auto.name,
          triggerType: auto.trigger_type,
          skillName: auto.skill_name,
          enabled: auto.enabled,
          runCount: auto.run_count,
          lastTriggeredAt: auto.last_triggered_at,
          lastError: auto.last_error,
          errorRate,
          dailyRuns,
          dailyErrors,
          health: 'healthy' as AutomationHealthItem['health'],
        };
        item.health = deriveHealth(item);
        return item;
      });

      const totalRuns7d = acts.length;
      const totalErrors7d = acts.filter(a => a.status === 'failed').length;

      return {
        items,
        total: items.length,
        enabled: items.filter(i => i.enabled).length,
        healthy: items.filter(i => i.health === 'healthy').length,
        warning: items.filter(i => i.health === 'warning').length,
        erroring: items.filter(i => i.health === 'error').length,
        totalRuns7d,
        overallErrorRate: totalRuns7d > 0 ? totalErrors7d / totalRuns7d : 0,
      } as AutomationHealthData;
    },
  });
}
