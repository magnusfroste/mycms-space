// ============================================
// Hook: Page Tracking
// Automatically tracks page views on route changes
// ============================================

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '@/models/analytics';

export const usePageTracking = () => {
  const location = useLocation();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    const currentPath = location.pathname;
    
    // Avoid tracking the same path twice in a row
    if (currentPath === lastTrackedPath.current) return;
    
    // Don't track admin pages
    if (currentPath.startsWith('/admin')) return;

    lastTrackedPath.current = currentPath;
    
    // Get page slug from path
    const pageSlug = currentPath === '/' ? 'home' : currentPath.slice(1);
    
    trackPageView(pageSlug).catch((err) => {
      console.error('Failed to track page view:', err);
    });
  }, [location.pathname]);
};
