// ============================================
// About Split Block
// Wrapper for AboutMe component
// ============================================

import React from 'react';
import AboutMe from '@/components/AboutMe';

interface AboutSplitBlockConfig {
  data_source?: string;
}

interface AboutSplitBlockProps {
  config: Record<string, unknown>;
}

const AboutSplitBlock: React.FC<AboutSplitBlockProps> = ({ config }) => {
  // Config can be extended in the future for custom data sources
  const _typedConfig = config as AboutSplitBlockConfig;

  return <AboutMe />;
};

export default AboutSplitBlock;
