// ============================================
// Theme Hook - Simplified
// Single source of truth for branding theme
//
// - The theme comes from modules.branding.module_config.theme.
// - `?theme=<id>` previews another theme for the rest of the browser tab
//   (remembered in sessionStorage); `?theme=reset` clears the preview.
// - Routes under /admin are left alone: the admin applies its own theme.
// ============================================

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useModule } from '@/models/modules';
import type { BrandingModuleConfig } from '@/types/modules';

type ThemeId = BrandingModuleConfig['theme'];

const THEME_IDS: readonly ThemeId[] = ['elegant', 'grok', 'sana', 'terminal', 'studio'];
const PREVIEW_STORAGE_KEY = 'branding-theme-preview';
// Read by the inline script in index.html to set the theme before first paint.
const SAVED_STORAGE_KEY = 'branding-theme';

const isThemeId = (value: string | null): value is ThemeId =>
  value !== null && (THEME_IDS as readonly string[]).includes(value);

/** Resolve the preview theme from the URL (and remember it), or from earlier in this tab. */
const resolvePreviewTheme = (search: string): ThemeId | null => {
  const fromUrl = new URLSearchParams(search).get('theme');
  try {
    if (fromUrl !== null) {
      if (isThemeId(fromUrl)) {
        sessionStorage.setItem(PREVIEW_STORAGE_KEY, fromUrl);
        return fromUrl;
      }
      // Any other value (e.g. ?theme=reset) ends the preview
      sessionStorage.removeItem(PREVIEW_STORAGE_KEY);
      return null;
    }
    const stored = sessionStorage.getItem(PREVIEW_STORAGE_KEY);
    return isThemeId(stored) ? stored : null;
  } catch {
    // sessionStorage can be unavailable (private mode, blocked storage)
    return isThemeId(fromUrl) ? fromUrl : null;
  }
};

const applyTheme = (theme: ThemeId) => {
  if (theme === 'elegant') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
};

export const useBrandingTheme = () => {
  const { data: module, isLoading } = useModule('branding');
  const { pathname, search } = useLocation();
  const isAdminRoute = pathname.startsWith('/admin');

  const savedTheme = (module?.module_config as BrandingModuleConfig | undefined)?.theme || 'elegant';
  const previewTheme = isAdminRoute ? null : resolvePreviewTheme(search);

  useEffect(() => {
    // The admin forces its own theme; never touch data-theme there
    if (isAdminRoute) return;

    // A preview can be applied right away, without waiting for the DB
    if (previewTheme) {
      applyTheme(previewTheme);
      return;
    }

    if (isLoading || !module) return;
    applyTheme(savedTheme);
    try {
      localStorage.setItem(SAVED_STORAGE_KEY, savedTheme);
    } catch {
      // storage unavailable: the theme still applies, only the first paint may differ
    }
  }, [isAdminRoute, previewTheme, savedTheme, module, isLoading]);

  return {
    theme: previewTheme || savedTheme,
    isPreview: !!previewTheme,
    isLoading,
  };
};

export default useBrandingTheme;
