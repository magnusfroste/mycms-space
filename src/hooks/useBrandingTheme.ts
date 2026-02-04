// ============================================
// Theme Hook
// Applies branding theme to the document
// ============================================

import { useEffect } from 'react';
import { useModule } from '@/models/modules';
import type { BrandingModuleConfig } from '@/types/modules';

export const useBrandingTheme = () => {
  const { data: module, isLoading } = useModule('branding');
  
  useEffect(() => {
    if (isLoading || !module) return;
    
    const config = module.module_config as BrandingModuleConfig | undefined;
    const theme = config?.theme || 'elegant';
    const forceDark = config?.force_dark || false;
    
    // Apply theme attribute
    if (theme === 'elegant') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
    
    // Apply forced dark mode
    if (forceDark) {
      document.documentElement.classList.add('dark');
    }
    
    return () => {
      // Cleanup on unmount (shouldn't normally happen)
      document.documentElement.removeAttribute('data-theme');
    };
  }, [module, isLoading]);
  
  return {
    theme: (module?.module_config as BrandingModuleConfig | undefined)?.theme || 'elegant',
    forceDark: (module?.module_config as BrandingModuleConfig | undefined)?.force_dark || false,
    isLoading,
  };
};

export default useBrandingTheme;
