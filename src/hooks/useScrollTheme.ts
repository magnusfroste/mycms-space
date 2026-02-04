// ============================================
// Scroll Theme Hook
// Detects visible sections and triggers theme changes
// ============================================

import { useEffect, useRef, useCallback } from 'react';

export type SectionTheme = 'default' | 'dark' | 'light' | 'accent' | 'gradient';

interface UseScrollThemeOptions {
  theme?: SectionTheme;
  threshold?: number;
}

/**
 * Hook that applies a theme when the section becomes visible
 * Uses IntersectionObserver for performance
 */
export const useScrollTheme = ({ theme = 'default', threshold = 0.4 }: UseScrollThemeOptions = {}) => {
  const sectionRef = useRef<HTMLDivElement>(null);

  const applyTheme = useCallback((sectionTheme: SectionTheme) => {
    if (sectionTheme === 'default') {
      document.documentElement.removeAttribute('data-section-theme');
    } else {
      document.documentElement.setAttribute('data-section-theme', sectionTheme);
    }
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || theme === 'default') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            applyTheme(theme);
          }
        });
      },
      { 
        threshold,
        rootMargin: '-10% 0px -10% 0px' // Trigger when section is well into viewport
      }
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
    };
  }, [theme, threshold, applyTheme]);

  return { sectionRef };
};

export default useScrollTheme;
