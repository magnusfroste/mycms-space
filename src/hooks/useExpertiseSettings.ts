import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export interface ExpertiseArea {
  id: string;
  title: string;
  description: string;
  icon: string;
  order_index: number;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

// Fetch all expertise areas
export const useExpertiseAreas = () => {
  return useQuery({
    queryKey: ['expertise-areas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expertise_areas')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as ExpertiseArea[];
    },
  });
};

// Create new expertise area
export const useCreateExpertiseArea = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (newArea: Omit<ExpertiseArea, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('expertise_areas')
        .insert([newArea])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expertise-areas'] });
      toast({
        title: 'Success',
        description: 'Expertise area created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create expertise area: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};

// Update expertise area
export const useUpdateExpertiseArea = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ExpertiseArea> & { id: string }) => {
      const { data, error } = await supabase
        .from('expertise_areas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expertise-areas'] });
      toast({
        title: 'Success',
        description: 'Expertise area updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update expertise area: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};

// Delete expertise area
export const useDeleteExpertiseArea = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('expertise_areas')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expertise-areas'] });
      toast({
        title: 'Success',
        description: 'Expertise area deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete expertise area: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};

// Real-time subscription hook
export const useExpertiseAreasSubscription = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('expertise_areas_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expertise_areas',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['expertise-areas'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};
