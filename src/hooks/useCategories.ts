import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Category {
  id: string;
  name: string;
  slug: string;
  order_index: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('enabled', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
};

export const useProjectCategories = (projectId?: string) => {
  return useQuery({
    queryKey: ['project-categories', projectId],
    queryFn: async (): Promise<Category[]> => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('project_categories')
        .select('category_id, categories(*)')
        .eq('project_id', projectId);

      if (error) throw error;
      return data?.map((pc: any) => pc.categories).filter(Boolean) || [];
    },
    enabled: !!projectId,
  });
};

export const useUpdateProjectCategories = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      projectId, 
      categoryIds 
    }: { 
      projectId: string; 
      categoryIds: string[] 
    }) => {
      // First, delete existing associations
      await supabase
        .from('project_categories')
        .delete()
        .eq('project_id', projectId);

      // Then, insert new associations
      if (categoryIds.length > 0) {
        const { error } = await supabase
          .from('project_categories')
          .insert(
            categoryIds.map(categoryId => ({
              project_id: projectId,
              category_id: categoryId,
            }))
          );

        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-categories', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};
