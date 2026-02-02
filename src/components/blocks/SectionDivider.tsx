// ============================================
// Section Divider Component
// Subtle gradient transition between sections
// ============================================

import React from 'react';

interface SectionDividerProps {
  variant?: 'fade' | 'gradient' | 'line';
  className?: string;
}

const SectionDivider: React.FC<SectionDividerProps> = ({ 
  variant = 'fade',
  className = '' 
}) => {
  if (variant === 'line') {
    return (
      <div className={`section-divider-line ${className}`} aria-hidden="true">
        <div className="h-px w-full max-w-md mx-auto bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>
    );
  }

  if (variant === 'gradient') {
    return (
      <div className={`section-divider-gradient ${className}`} aria-hidden="true" />
    );
  }

  // Default: fade
  return (
    <div className={`section-divider-fade ${className}`} aria-hidden="true" />
  );
};

export default SectionDivider;
