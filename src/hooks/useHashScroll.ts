// ============================================
// useHashScroll
// Scrolls to the section named in location.hash once page content is ready
// (block-based pages render asynchronously, so the browser's native jump
// happens before the target exists). Uses anchor aliases, see lib/utils/anchors.
// If the section isn't on this page but has a dedicated route (projects,
// contact), navigates there instead.
// ============================================

import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { scrollToAnchor, getAnchorFallbackRoute } from '@/lib/utils/anchors';

export const useHashScroll = (ready: boolean) => {
  const { hash, pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!ready || !hash) return;
    // Wait a frame so freshly rendered blocks are in the DOM
    const id = window.requestAnimationFrame(() => {
      if (scrollToAnchor(hash)) return;
      const fallback = getAnchorFallbackRoute(hash);
      if (fallback && fallback !== pathname) navigate(fallback, { replace: true });
    });
    return () => window.cancelAnimationFrame(id);
  }, [ready, hash, pathname, navigate]);
};
