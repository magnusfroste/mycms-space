// ============================================
// Current theme (reads the applied data-theme attribute)
// Lets blocks branch on the active theme and re-render when it changes.
// ============================================

import { useSyncExternalStore } from 'react';

const subscribe = (onChange: () => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => observer.disconnect();
};

const getSnapshot = () => document.documentElement.getAttribute('data-theme') || 'elegant';
const getServerSnapshot = () => 'elegant';

/** The theme currently applied to <html> ('elegant' when none is set). */
export const useCurrentTheme = () => useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

/** True while the quiet "studio" theme is active. */
export const useIsStudio = () => useCurrentTheme() === 'studio';

export default useCurrentTheme;
