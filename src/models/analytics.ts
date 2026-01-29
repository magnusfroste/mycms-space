// ============================================
// Model Layer: Analytics
// Business logic, React Query hooks, UI feedback
// ============================================

import { useQuery } from '@tanstack/react-query';
import * as analyticsData from '@/data/analytics';
import type { AnalyticsSummary } from '@/types/analytics';

// Re-export types and tracking functions
export type { AnalyticsSummary } from '@/types/analytics';
export { 
  trackPageView, 
  trackProjectView, 
  trackChatSession, 
  updateChatSession,
  getVisitorId 
} from '@/data/analytics';

// Query keys
export const analyticsKeys = {
  summary: (days: number) => ['analytics-summary', days] as const,
};

// Fetch analytics summary hook
export const useAnalyticsSummary = (days: number = 30) => {
  return useQuery<AnalyticsSummary>({
    queryKey: analyticsKeys.summary(days),
    queryFn: () => analyticsData.fetchAnalyticsSummary(days),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
