// ============================================
// Scroll Theme Section Wrapper
// Wraps blocks and triggers theme changes on scroll
// ============================================

import React from 'react';
import { useScrollTheme, type SectionTheme } from '@/hooks/useScrollTheme';

interface ScrollThemeSectionProps {
  children: React.ReactNode;
  theme?: SectionTheme;
  className?: string;
}

const ScrollThemeSection: React.FC<ScrollThemeSectionProps> = ({
  children,
  theme = 'default',
  className = '',
}) => {
  const { sectionRef } = useScrollTheme({ theme });

  return (
    <div ref={sectionRef} className={className}>
      {children}
    </div>
  );
};

export default ScrollThemeSection;
