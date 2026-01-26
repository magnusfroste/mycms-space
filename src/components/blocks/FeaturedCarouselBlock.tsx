// ============================================
// Featured Carousel Block
// Wrapper for FeaturedIn component with configurable title
// ============================================

import React from 'react';
import FeaturedIn from '@/components/FeaturedIn';

interface FeaturedCarouselBlockConfig {
  title?: string;
  subtitle?: string;
}

interface FeaturedCarouselBlockProps {
  config: Record<string, unknown>;
}

const FeaturedCarouselBlock: React.FC<FeaturedCarouselBlockProps> = ({ config }) => {
  const typedConfig = config as FeaturedCarouselBlockConfig;

  return (
    <FeaturedIn 
      title={typedConfig.title} 
      subtitle={typedConfig.subtitle} 
    />
  );
};

export default FeaturedCarouselBlock;
