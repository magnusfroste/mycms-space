// ============================================
// Expertise Grid Block
// Wrapper for ExpertiseCards component with configurable title
// ============================================

import React from 'react';
import ExpertiseCards from '@/components/ExpertiseCards';

interface ExpertiseGridBlockConfig {
  title?: string;
  subtitle?: string;
  columns?: 2 | 3;
}

interface ExpertiseGridBlockProps {
  config: Record<string, unknown>;
}

const ExpertiseGridBlock: React.FC<ExpertiseGridBlockProps> = ({ config }) => {
  const typedConfig = config as ExpertiseGridBlockConfig;

  return (
    <ExpertiseCards 
      title={typedConfig.title} 
      subtitle={typedConfig.subtitle} 
    />
  );
};

export default ExpertiseGridBlock;
