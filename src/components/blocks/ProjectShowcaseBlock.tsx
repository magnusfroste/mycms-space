// ============================================
// Project Showcase Block
// Wrapper for ProjectShowcase component
// ============================================

import React from 'react';
import ProjectShowcase from '@/components/ProjectShowcase';

interface ProjectShowcaseBlockConfig {
  data_source?: string;
  show_categories?: boolean;
}

interface ProjectShowcaseBlockProps {
  config: Record<string, unknown>;
}

const ProjectShowcaseBlock: React.FC<ProjectShowcaseBlockProps> = ({ config }) => {
  // Config can be extended to support filtering and category display
  const _typedConfig = config as ProjectShowcaseBlockConfig;

  return <ProjectShowcase />;
};

export default ProjectShowcaseBlock;
