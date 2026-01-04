// ============================================
// Model Layer: Quick Actions
// Business logic, React Query hooks
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as quickActionsData from '@/data/quickActions';
import type { QuickAction } from '@/types';

// Re-export types
export type { QuickAction };

// Query keys
export const quickActionKeys = {
  all: ['quick-actions'] as const,
  enabled: ['quick-actions', 'enabled'] as const,
};

// Fetch enabled quick actions only
export const useQuickActions = () => {
  return useQuery({
    queryKey: quickActionKeys.enabled,
    queryFn: () => quickActionsData.fetchQuickActions(true),
  });
};

// Fetch all quick actions (for admin)
export const useAllQuickActions = () => {
  return useQuery({
    queryKey: quickActionKeys.all,
    queryFn: () => quickActionsData.fetchQuickActions(false),
  });
};

// Create quick action
export const useCreateQuickAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: quickActionsData.createQuickAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quickActionKeys.all });
      queryClient.invalidateQueries({ queryKey: quickActionKeys.enabled });
    },
  });
};

// Update quick action
export const useUpdateQuickAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...updates }: Partial<QuickAction> & { id: string }) =>
      quickActionsData.updateQuickAction(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quickActionKeys.all });
      queryClient.invalidateQueries({ queryKey: quickActionKeys.enabled });
    },
  });
};

// Delete quick action
export const useDeleteQuickAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: quickActionsData.deleteQuickAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quickActionKeys.all });
      queryClient.invalidateQueries({ queryKey: quickActionKeys.enabled });
    },
  });
};
