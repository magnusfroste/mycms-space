// ============================================
// Theme Hook - Simplified
// Single source of truth for branding theme
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
    
    // Single source of truth - just set the data-theme attribute
    if (theme === 'elegant') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
    
    console.log('[Branding] Applied theme:', theme);
  }, [module, isLoading]);
  
  return {
    theme: (module?.module_config as BrandingModuleConfig | undefined)?.theme || 'elegant',
    isLoading,
  };
};

export default useBrandingTheme;
