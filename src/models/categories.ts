// ============================================
// Model Layer: Categories
// Business logic, React Query hooks
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as categoriesData from '@/data/categories';
import type { Category } from '@/types';

// Re-export types
export type { Category };

// Query keys
export const categoryKeys = {
  all: ['categories'] as const,
  forProject: (projectId: string) => ['project-categories', projectId] as const,
};

// Fetch all enabled categories
export const useCategories = () => {
  return useQuery({
    queryKey: categoryKeys.all,
    queryFn: categoriesData.fetchCategories,
  });
};

// Fetch categories for a specific project
export const useProjectCategories = (projectId?: string) => {
  return useQuery({
    queryKey: categoryKeys.forProject(projectId || ''),
    queryFn: () => categoriesData.fetchProjectCategories(projectId!),
    enabled: !!projectId,
  });
};

// Update project categories
export const useUpdateProjectCategories = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, categoryIds }: { projectId: string; categoryIds: string[] }) =>
      categoriesData.updateProjectCategories(projectId, categoryIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.forProject(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};
