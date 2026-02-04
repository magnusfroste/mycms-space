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
  const { setTheme, theme: currentTheme } = useTheme();
  
  // Apply branding theme
  useEffect(() => {
    if (isLoading || !module) return;
    
    const config = module.module_config as BrandingModuleConfig | undefined;
    const brandingTheme = config?.theme || 'elegant';
    const forceDark = config?.force_dark || false;
    
    // Function to apply data-theme attribute
    const applyDataTheme = () => {
      if (brandingTheme === 'elegant') {
        document.documentElement.removeAttribute('data-theme');
      } else {
        document.documentElement.setAttribute('data-theme', brandingTheme);
      }
    };
    
    // Apply immediately
    applyDataTheme();
    
    // Apply again after a delay to ensure next-themes doesn't override
    const timeoutId = setTimeout(applyDataTheme, 50);
    const timeoutId2 = setTimeout(applyDataTheme, 200);
    
    // Apply forced dark mode via next-themes
    if (forceDark && currentTheme !== 'dark') {
      setTheme('dark');
    }
    
    console.log('[Branding] Applied theme:', brandingTheme, 'forceDark:', forceDark);
    
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
    };
  }, [module, isLoading, setTheme, currentTheme]);
  
  return {
    theme: (module?.module_config as BrandingModuleConfig | undefined)?.theme || 'elegant',
    forceDark: (module?.module_config as BrandingModuleConfig | undefined)?.force_dark || false,
    isLoading,
  };
};

export default useBrandingTheme;
