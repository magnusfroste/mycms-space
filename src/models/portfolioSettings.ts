// ============================================
// Model Layer: Portfolio Settings
// Business logic, React Query hooks, UI feedback
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import * as portfolioSettingsData from '@/data/portfolioSettings';
import type { PortfolioSettings } from '@/types';

// Re-export types
export type { PortfolioSettings };

// Query keys
export const portfolioSettingsKeys = {
  settings: ['portfolio-settings'] as const,
};

// Fetch portfolio settings
export const usePortfolioSettings = () => {
  return useQuery({
    queryKey: portfolioSettingsKeys.settings,
    queryFn: portfolioSettingsData.fetchPortfolioSettings,
  });
};

// Update portfolio settings
export const useUpdatePortfolioSettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: portfolioSettingsData.updatePortfolioSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portfolioSettingsKeys.settings });
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
