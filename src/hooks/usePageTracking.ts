// ============================================
// Hook: Page Tracking
// Automatically tracks page views on route changes
// ============================================

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '@/models/analytics';
import { useGitHubModule } from '@/models/modules';

/** Long enough for client-side redirects to settle. */
const TRACK_DELAY_MS = 1500;

export const usePageTracking = () => {
  const location = useLocation();
  const lastTrackedPath = useRef<string | null>(null);
  // Old project slugs redirect once the GitHub module has loaded (project_redirects).
  const { config: githubConfig, isLoading: githubLoading } = useGitHubModule();
  const projectRedirects = githubConfig?.project_redirects;

  useEffect(() => {
    const currentPath = location.pathname;
    const projectSlug = currentPath.startsWith('/project/') ? currentPath.slice('/project/'.length) : null;
    if (projectSlug !== null) {
      // Wait for the redirect map, and never count the old slug of a redirect.
      if (githubLoading) return;
      if (projectRedirects?.[projectSlug]) return;
    }

    // Avoid tracking the same path twice in a row
    if (currentPath === lastTrackedPath.current) return;

    // Don't track admin pages
    if (currentPath.startsWith('/admin')) return;

    // Track after a short pause: a client-side redirect (/resume …) replaces
    // the path first, and only the page the visitor lands on counts.
    const timer = setTimeout(() => {
      lastTrackedPath.current = currentPath;
      const pageSlug = currentPath === '/' ? 'home' : currentPath.slice(1);
      trackPageView(pageSlug).catch((err) => {
        console.error('Failed to track page view:', err);
      });
    }, TRACK_DELAY_MS);
    return () => clearTimeout(timer);
  }, [location.pathname, githubLoading, projectRedirects]);
};
