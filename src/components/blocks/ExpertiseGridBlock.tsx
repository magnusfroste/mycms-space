// ============================================
// Expertise Grid Block
// Wrapper for ExpertiseCards component
// ============================================

import React from 'react';
import ExpertiseCards from '@/components/ExpertiseCards';

interface ExpertiseGridBlockConfig {
  data_source?: string;
  columns?: 2 | 3;
}

interface ExpertiseGridBlockProps {
  config: Record<string, unknown>;
}

const ExpertiseGridBlock: React.FC<ExpertiseGridBlockProps> = ({ config }) => {
  // Config can be extended to support different column layouts
  const _typedConfig = config as ExpertiseGridBlockConfig;

  return <ExpertiseCards />;
};

export default ExpertiseGridBlock;
