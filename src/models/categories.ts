// ============================================
// Model Layer: Categories
// Business logic, React Query hooks
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as categoriesData from '@/data/categories';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '@/types';

// Re-export types
export type { Category, CreateCategoryInput, UpdateCategoryInput };

// Query keys
export const categoryKeys = {
  all: ['categories'] as const,
  allAdmin: ['categories', 'admin'] as const,
  forProject: (projectId: string) => ['project-categories', projectId] as const,
};

// Fetch all enabled categories (public)
export const useCategories = () => {
  return useQuery({
    queryKey: categoryKeys.all,
    queryFn: categoriesData.fetchCategories,
  });
};

// Fetch all categories including disabled (admin)
export const useAllCategories = () => {
  return useQuery({
    queryKey: categoryKeys.allAdmin,
    queryFn: categoriesData.fetchAllCategories,
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

// Create a new category
export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCategoryInput) => categoriesData.createCategory(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      queryClient.invalidateQueries({ queryKey: categoryKeys.allAdmin });
    },
  });
};

// Update an existing category
export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateCategoryInput) => categoriesData.updateCategory(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      queryClient.invalidateQueries({ queryKey: categoryKeys.allAdmin });
    },
  });
};

// Delete a category
export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => categoriesData.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      queryClient.invalidateQueries({ queryKey: categoryKeys.allAdmin });
    },
  });
};

// Reorder categories
export const useReorderCategories = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderedIds: string[]) => categoriesData.reorderCategories(orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      queryClient.invalidateQueries({ queryKey: categoryKeys.allAdmin });
    },
  });
};
