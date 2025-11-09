import { useEffect } from 'react';
import { analyticsService } from '@/services/analyticsService';

// Hook to track page visits
export const useAnalytics = (page: string) => {
  useEffect(() => {
    analyticsService.trackPageVisit(page);
  }, [page]);
};
