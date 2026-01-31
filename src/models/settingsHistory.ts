// ============================================
// Model Layer: Settings History
// Business logic, React Query hooks
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import * as settingsHistoryData from '@/data/settingsHistory';
import type { SettingsHistoryEntry } from '@/data/settingsHistory';

// Re-export types and helpers
export type { SettingsHistoryEntry };
export { tableLabels } from '@/data/settingsHistory';

// Query keys
export const settingsHistoryKeys = {
  all: ['settings-history'] as const,
  byTable: (tableName: string) => ['settings-history', tableName] as const,
  entry: (id: string) => ['settings-history', 'entry', id] as const,
};

// Fetch all history entries
export const useSettingsHistory = (limit = 50) => {
  const queryClient = useQueryClient();

  // Subscribe to realtime updates
  useEffect(() => {
    const unsubscribe = settingsHistoryData.subscribeToSettingsHistory(() => {
      queryClient.invalidateQueries({ queryKey: settingsHistoryKeys.all });
    });

    return unsubscribe;
  }, [queryClient]);

  return useQuery({
    queryKey: settingsHistoryKeys.all,
    queryFn: () => settingsHistoryData.fetchSettingsHistory(limit),
  });
};

// Fetch history by table
export const useHistoryByTable = (tableName: string, limit = 20) => {
  return useQuery({
    queryKey: settingsHistoryKeys.byTable(tableName),
    queryFn: () => settingsHistoryData.fetchHistoryByTable(tableName, limit),
    enabled: !!tableName,
  });
};

// Fetch single entry
export const useHistoryEntry = (id: string) => {
  return useQuery({
    queryKey: settingsHistoryKeys.entry(id),
    queryFn: () => settingsHistoryData.fetchHistoryEntry(id),
    enabled: !!id,
  });
};

// Restore history entry
export const useRestoreHistoryEntry = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: settingsHistoryData.restoreHistoryEntry,
    onSuccess: (_, entry) => {
      // Invalidate both history and the affected table's queries
      queryClient.invalidateQueries({ queryKey: settingsHistoryKeys.all });
      
      // Invalidate the specific table that was restored
      const tableQueryMap: Record<string, string[]> = {
        about_me_settings: ['aboutMeSettings'],
        hero_settings: ['hero-settings'],
        portfolio_settings: ['portfolio-settings'],
        chat_settings: ['chat-settings'],
        page_blocks: ['page-blocks'],
        projects: ['projects'],
      };

      const queryKey = tableQueryMap[entry.table_name];
      if (queryKey) {
        queryClient.invalidateQueries({ queryKey });
      }

      toast({
        title: 'Återställt',
        description: 'Data har återställts till den valda versionen',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Fel',
        description: `Kunde inte återställa: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};
