// ============================================
// About Split Block
// Wrapper for AboutMe component with configurable title
// ============================================

import React from 'react';
import AboutMe from '@/components/AboutMe';

interface AboutSplitBlockConfig {
  title?: string;
  subtitle?: string;
}

interface AboutSplitBlockProps {
  config: Record<string, unknown>;
}

const AboutSplitBlock: React.FC<AboutSplitBlockProps> = ({ config }) => {
  const typedConfig = config as AboutSplitBlockConfig;

  return (
    <AboutMe 
      title={typedConfig.title} 
      subtitle={typedConfig.subtitle} 
    />
  );
};

export default AboutSplitBlock;
