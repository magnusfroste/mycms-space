// ============================================
// Spacer Block
// Empty space for layout control
// ============================================

import React from 'react';
import { cn } from '@/lib/utils';

interface SpacerBlockConfig {
  height?: 'sm' | 'md' | 'lg' | 'xl';
}

interface SpacerBlockProps {
  config: Record<string, unknown>;
}

const SpacerBlock: React.FC<SpacerBlockProps> = ({ config }) => {
  const typedConfig = config as SpacerBlockConfig;
  const { height = 'md' } = typedConfig;

  const heightClasses = {
    sm: 'h-8 md:h-12',
    md: 'h-16 md:h-24',
    lg: 'h-24 md:h-32',
    xl: 'h-32 md:h-48',
  };

  return <div className={cn(heightClasses[height])} aria-hidden="true" />;
};

export default SpacerBlock;
