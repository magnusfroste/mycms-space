// ============================================
// Featured Carousel Block
// Wrapper for FeaturedIn component
// ============================================

import React from 'react';
import FeaturedIn from '@/components/FeaturedIn';

interface FeaturedCarouselBlockConfig {
  data_source?: string;
}

interface FeaturedCarouselBlockProps {
  config: Record<string, unknown>;
}

const FeaturedCarouselBlock: React.FC<FeaturedCarouselBlockProps> = ({ config }) => {
  // Config can be extended in the future
  const _typedConfig = config as FeaturedCarouselBlockConfig;

  return <FeaturedIn />;
};

export default FeaturedCarouselBlock;
