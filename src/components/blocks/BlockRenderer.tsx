// ============================================
// Block Renderer
// Routes each block_type to its corresponding component
// ============================================

import React from 'react';
import type { PageBlock } from '@/types';
import ChatHeroBlock from './ChatHeroBlock';
import TextSectionBlock from './TextSectionBlock';
import ExpertiseGridBlock from './ExpertiseGridBlock';
import CtaBannerBlock from './CtaBannerBlock';
import ContactFormBlock from './ContactFormBlock';
import BlogBlock from './BlogBlock';
import SectionDivider from './SectionDivider';
import GitHubBlock from './GitHubBlock';

// Block types that should have dividers after them
const BLOCKS_WITH_DIVIDER = ['hero', 'chat-hero', 'about-split', 'expertise-grid', 'project-showcase', 'text-section', 'github', 'skills-bar', 'values', 'cv-agent'];

interface BlockRendererProps {
  block: PageBlock;
  isLast?: boolean;
  /** Render the block's section title as the page <h1> (when no hero block provides one) */
  promoteHeading?: boolean;
}

const BlockRenderer: React.FC<BlockRendererProps> = ({ block, isLast = false, promoteHeading = false }) => {
  const { block_type, block_config } = block;
  const showDivider = !isLast && BLOCKS_WITH_DIVIDER.includes(block_type);
  
  // Anchor ID = block_type (e.g., "chat-hero", "project-showcase")
  // Custom anchor_id in block_config overrides default
  const anchorId = (block_config && typeof block_config === 'object' && 'anchor_id' in block_config)
    ? (block_config.anchor_id as string)
    : block_type;

  const renderBlock = () => {
    switch (block_type) {
      case 'chat-hero':
        return <ChatHeroBlock config={block_config} />;
      case 'text-section':
        return <TextSectionBlock config={block_config} />;
      case 'expertise-grid':
        return <ExpertiseGridBlock config={block_config} />;
      case 'cta-banner':
        return <CtaBannerBlock config={block_config} />;
      case 'contact-form':
        return <ContactFormBlock config={block_config} />;
      case 'blog':
        return <BlogBlock config={block_config} />;
      case 'github':
        return <GitHubBlock config={block_config} headingLevel={promoteHeading ? 'h1' : 'h2'} />;
      default:
        // Unknown or retired block types render nothing for visitors.
        if (import.meta.env.DEV) console.warn(`[BlockRenderer] Unknown block type: ${block_type}`);
        return null;
    }
  };

  return (
    <>
      {/* data-block-type lets nav anchors resolve by block type even when a custom anchor_id is set */}
      <div id={anchorId || undefined} data-block-type={block_type} className="scroll-mt-20" />
      {renderBlock()}
      {showDivider && <SectionDivider variant="fade" />}
    </>
  );
};

export default BlockRenderer;
