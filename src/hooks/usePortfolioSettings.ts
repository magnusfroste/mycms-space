import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PortfolioSettings {
  id: string;
  section_title: string;
  section_subtitle: string;
  section_description: string;
  show_section: boolean;
  created_at: string;
  updated_at: string;
}

export const usePortfolioSettings = () => {
  return useQuery({
    queryKey: ['portfolio-settings'],
    queryFn: async (): Promise<PortfolioSettings> => {
      const { data, error } = await supabase
        .from('portfolio_settings')
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
  });
};

export const useUpdatePortfolioSettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (settings: Partial<PortfolioSettings>) => {
      const { data: existing } = await supabase
        .from('portfolio_settings')
        .select('id')
        .single();

      if (!existing) {
        const { error } = await supabase
          .from('portfolio_settings')
          .insert(settings);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('portfolio_settings')
          .update(settings)
          .eq('id', existing.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-settings'] });
      toast({
        title: 'Success',
        description: 'Portfolio settings updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to update settings: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};
