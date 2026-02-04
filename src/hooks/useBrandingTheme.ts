// ============================================
// Theme Hook
// Applies branding theme to the document
// ============================================

import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useModule } from '@/models/modules';
import type { BrandingModuleConfig } from '@/types/modules';

export const useBrandingTheme = () => {
  const { data: module, isLoading } = useModule('branding');
  const { setTheme } = useTheme();
  
  useEffect(() => {
    if (isLoading || !module) return;
    
    const config = module.module_config as BrandingModuleConfig | undefined;
    const theme = config?.theme || 'elegant';
    const forceDark = config?.force_dark || false;
    
    // Apply theme attribute (data-theme for CSS theme variants)
    if (theme === 'elegant') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
    
    // Apply forced dark mode via next-themes
    if (forceDark) {
      setTheme('dark');
    }
    
    // Debug log
    console.log('[Branding] Applied theme:', theme, 'forceDark:', forceDark);
    
  }, [module, isLoading, setTheme]);
  
  return {
    theme: (module?.module_config as BrandingModuleConfig | undefined)?.theme || 'elegant',
    forceDark: (module?.module_config as BrandingModuleConfig | undefined)?.force_dark || false,
    isLoading,
  };
};

export default useBrandingTheme;
