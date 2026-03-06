import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { AgentAutomation } from '@/types/agent';

export function useAutomations() {
  return useQuery({
    queryKey: ['agent-automations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_automations')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as AgentAutomation[];
    },
  });
}

export function useUpsertAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (auto: Partial<AgentAutomation> & { name: string }) => {
      const payload = {
        name: auto.name,
        description: auto.description ?? null,
        trigger_type: auto.trigger_type ?? 'cron',
        trigger_config: auto.trigger_config ?? {},
        skill_id: auto.skill_id ?? null,
        skill_name: auto.skill_name ?? '',
        skill_arguments: auto.skill_arguments ?? {},
        objective_id: auto.objective_id ?? null,
        enabled: auto.enabled ?? true,
      };
      if (auto.id) {
        const { error } = await supabase.from('agent_automations').update(payload as any).eq('id', auto.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('agent_automations').insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent-automations'] });
      toast.success('Automation saved');
    },
    onError: () => toast.error('Failed to save automation'),
  });
}

export function useToggleAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase.from('agent_automations').update({ enabled }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agent-automations'] }),
    onError: () => toast.error('Failed to toggle automation'),
  });
}

export function useDeleteAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('agent_automations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent-automations'] });
      toast.success('Automation deleted');
    },
    onError: () => toast.error('Failed to delete automation'),
  });
}
