import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { AgentObjective } from '@/types/agent';

export function useObjectives(statusFilter?: string) {
  return useQuery({
    queryKey: ['agent-objectives', statusFilter],
    queryFn: async () => {
      let q = supabase.from('agent_objectives').select('*').order('created_at', { ascending: false });
      if (statusFilter && statusFilter !== 'all') q = q.eq('status', statusFilter as any);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as AgentObjective[];
    },
  });
}

export function useUpsertObjective() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (obj: Partial<AgentObjective> & { goal: string }) => {
      const payload = {
        goal: obj.goal,
        constraints: obj.constraints ?? {},
        success_criteria: obj.success_criteria ?? {},
        progress: obj.progress ?? {},
        status: obj.status ?? 'active',
      };
      if (obj.id) {
        const { error } = await supabase.from('agent_objectives').update(payload as any).eq('id', obj.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('agent_objectives').insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent-objectives'] });
      toast.success('Objective saved');
    },
    onError: () => toast.error('Failed to save objective'),
  });
}

export function useDeleteObjective() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('agent_objectives').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent-objectives'] });
      toast.success('Objective deleted');
    },
    onError: () => toast.error('Failed to delete objective'),
  });
}

export function useUpdateObjectiveStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: Record<string, unknown> = { status };
      if (status === 'completed') updates.completed_at = new Date().toISOString();
      const { error } = await supabase.from('agent_objectives').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agent-objectives'] }),
    onError: () => toast.error('Failed to update status'),
  });
}
