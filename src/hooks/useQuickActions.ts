import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface QuickAction {
  id: string;
  icon: string;
  label: string;
  message: string;
  order_index: number;
  enabled: boolean;
}

export const useQuickActions = () => {
  return useQuery({
    queryKey: ['quick-actions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quick_actions')
        .select('*')
        .eq('enabled', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as QuickAction[];
    },
  });
};

export const useAllQuickActions = () => {
  return useQuery({
    queryKey: ['all-quick-actions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quick_actions')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as QuickAction[];
    },
  });
};

export const useCreateQuickAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (action: Omit<QuickAction, 'id'>) => {
      const { data, error } = await supabase
        .from('quick_actions')
        .insert(action)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quick-actions'] });
      queryClient.invalidateQueries({ queryKey: ['all-quick-actions'] });
    },
  });
};

export const useUpdateQuickAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<QuickAction> & { id: string }) => {
      const { data, error } = await supabase
        .from('quick_actions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quick-actions'] });
      queryClient.invalidateQueries({ queryKey: ['all-quick-actions'] });
    },
  });
};

export const useDeleteQuickAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('quick_actions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quick-actions'] });
      queryClient.invalidateQueries({ queryKey: ['all-quick-actions'] });
    },
  });
};
