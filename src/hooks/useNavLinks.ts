import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface NavLink {
  id: string;
  label: string;
  url: string;
  order_index: number;
  enabled: boolean;
  is_external: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateNavLinkInput {
  label: string;
  url: string;
  order_index: number;
  enabled?: boolean;
  is_external?: boolean;
}

export interface UpdateNavLinkInput {
  id: string;
  label?: string;
  url?: string;
  order_index?: number;
  enabled?: boolean;
  is_external?: boolean;
}

export const useNavLinks = () => {
  return useQuery({
    queryKey: ['nav-links'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nav_links')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as NavLink[];
    },
  });
};

export const useAllNavLinks = () => {
  return useQuery({
    queryKey: ['nav-links-all'],
    queryFn: async () => {
      // Use RPC or direct query that bypasses RLS for admin
      const { data, error } = await supabase
        .from('nav_links')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as NavLink[];
    },
  });
};

export const useCreateNavLink = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateNavLinkInput) => {
      const { data, error } = await supabase
        .from('nav_links')
        .insert([input])
        .select()
        .single();

      if (error) throw error;
      return data as NavLink;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nav-links'] });
      queryClient.invalidateQueries({ queryKey: ['nav-links-all'] });
      toast({ title: 'Success', description: 'Navigation link created' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

export const useUpdateNavLink = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateNavLinkInput) => {
      const { data, error } = await supabase
        .from('nav_links')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as NavLink;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nav-links'] });
      queryClient.invalidateQueries({ queryKey: ['nav-links-all'] });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

export const useDeleteNavLink = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('nav_links')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nav-links'] });
      queryClient.invalidateQueries({ queryKey: ['nav-links-all'] });
      toast({ title: 'Success', description: 'Navigation link deleted' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

export const useReorderNavLinks = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (updates: { id: string; order_index: number }[]) => {
      const promises = updates.map(({ id, order_index }) =>
        supabase.from('nav_links').update({ order_index }).eq('id', id)
      );
      const results = await Promise.all(promises);
      const error = results.find((r) => r.error)?.error;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nav-links'] });
      queryClient.invalidateQueries({ queryKey: ['nav-links-all'] });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};
