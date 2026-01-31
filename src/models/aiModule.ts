// ============================================
// Model Layer: AI Module
// Business logic, React Query hooks
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as aiModuleData from '@/data/aiModule';
import type { AIModuleSettings } from '@/types';

// Re-export types
export type { AIModuleSettings };

// Query keys
export const aiModuleKeys = {
  settings: ['ai-module'] as const,
};

// Fetch AI module settings
export const useAIModule = () => {
  return useQuery({
    queryKey: aiModuleKeys.settings,
    queryFn: aiModuleData.fetchAIModuleSettings,
  });
};

// Update AI module settings
export const useUpdateAIModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: aiModuleData.updateAIModuleSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiModuleKeys.settings });
    },
  });
};
