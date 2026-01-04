// ============================================
// Model Layer: Chat Settings
// Business logic, React Query hooks
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as chatSettingsData from '@/data/chatSettings';
import type { ChatSettings } from '@/types';

// Re-export types
export type { ChatSettings };

// Query keys
export const chatSettingsKeys = {
  settings: ['chat-settings'] as const,
};

// Fetch chat settings
export const useChatSettings = () => {
  return useQuery({
    queryKey: chatSettingsKeys.settings,
    queryFn: chatSettingsData.fetchChatSettings,
  });
};

// Update chat settings
export const useUpdateChatSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: chatSettingsData.updateChatSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatSettingsKeys.settings });
    },
  });
};
