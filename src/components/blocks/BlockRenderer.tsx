// ============================================
// Block Renderer
// Routes each block_type to its corresponding component
// ============================================

import React from 'react';
import type { PageBlock } from '@/types';
import type { NewsletterSubscribeBlockConfig } from '@/types/blockConfigs';
import HeroBlock from './HeroBlock';
import ChatHeroBlock from './ChatHeroBlock';
import ChatWidgetBlock from './ChatWidgetBlock';
import TextSectionBlock from './TextSectionBlock';
import AboutSplitBlock from './AboutSplitBlock';
import FeaturedCarouselBlock from './FeaturedCarouselBlock';
import ExpertiseGridBlock from './ExpertiseGridBlock';
import ProjectShowcaseBlock from './ProjectShowcaseBlock';
import ImageTextBlock from './ImageTextBlock';
import CtaBannerBlock from './CtaBannerBlock';
import SpacerBlock from './SpacerBlock';
import VideoHeroBlock from './VideoHeroBlock';
import ParallaxSectionBlock from './ParallaxSectionBlock';
import BentoGridBlock from './BentoGridBlock';
import MarqueeBlock from './MarqueeBlock';
import StatsCounterBlock from './StatsCounterBlock';
import TestimonialCarouselBlock from './TestimonialCarouselBlock';
import ContactFormBlock from './ContactFormBlock';
import BlogBlock from './BlogBlock';
import SectionDivider from './SectionDivider';
import NewsletterSubscribeBlock from './NewsletterSubscribeBlock';
import GitHubBlock from './GitHubBlock';
import SkillsBarBlock from './SkillsBarBlock';
import ValuesBlock from './ValuesBlock';

// Block types that should have dividers after them
const BLOCKS_WITH_DIVIDER = ['hero', 'chat-hero', 'about-split', 'expertise-grid', 'project-showcase', 'text-section', 'github', 'skills-bar', 'values'];

interface BlockRendererProps {
  block: PageBlock;
  isLast?: boolean;
}

const BlockRenderer: React.FC<BlockRendererProps> = ({ block, isLast = false }) => {
  const { block_type, block_config } = block;
  const showDivider = !isLast && BLOCKS_WITH_DIVIDER.includes(block_type);
  
  // Generate anchor ID from block type (e.g., "project-showcase" -> "projekt", "about-split" -> "about")
  const getAnchorId = (): string | undefined => {
    // Check if block_config has a custom anchor_id
    if (block_config && typeof block_config === 'object' && 'anchor_id' in block_config) {
      return block_config.anchor_id as string;
    }
    // Default mapping for common blocks
    const anchorMap: Record<string, string> = {
      'project-showcase': 'projekt',
      'about-split': 'about',
      'expertise-grid': 'expertis',
      'contact-form': 'kontakt',
      'blog': 'blogg',
      'github': 'github',
      'skills-bar': 'skills',
      'values': 'values',
      'testimonial-carousel': 'testimonials',
    };
    return anchorMap[block_type];
  };
  
  const anchorId = getAnchorId();

  const renderBlock = () => {
    switch (block_type) {
      case 'hero':
        return <HeroBlock config={block_config} />;
      case 'chat-hero':
        return <ChatHeroBlock config={block_config} />;
      case 'chat-widget':
        return <ChatWidgetBlock config={block_config} />;
      case 'text-section':
        return <TextSectionBlock config={block_config} />;
      case 'about-split':
        return <AboutSplitBlock config={block_config} />;
      case 'featured-carousel':
        return <FeaturedCarouselBlock config={block_config} />;
      case 'expertise-grid':
        return <ExpertiseGridBlock config={block_config} />;
      case 'project-showcase':
        return <ProjectShowcaseBlock config={block_config} />;
      case 'image-text':
        return <ImageTextBlock config={block_config} />;
      case 'cta-banner':
        return <CtaBannerBlock config={block_config} />;
      case 'spacer':
        return <SpacerBlock config={block_config} />;
      case 'video-hero':
        return <VideoHeroBlock config={block_config} />;
      case 'parallax-section':
        return <ParallaxSectionBlock config={block_config} />;
      case 'bento-grid':
        return <BentoGridBlock config={block_config} />;
      case 'marquee':
        return <MarqueeBlock config={block_config} />;
      case 'stats-counter':
        return <StatsCounterBlock config={block_config} />;
      case 'testimonial-carousel':
        return <TestimonialCarouselBlock config={block_config} />;
      case 'contact-form':
        return <ContactFormBlock config={block_config} />;
      case 'blog':
        return <BlogBlock config={block_config} />;
      case 'newsletter-subscribe':
        return <NewsletterSubscribeBlock config={block_config as unknown as NewsletterSubscribeBlockConfig} />;
      case 'github':
        return <GitHubBlock config={block_config} />;
      case 'skills-bar':
        return <SkillsBarBlock config={block_config} />;
      case 'values':
        return <ValuesBlock config={block_config} />;
      default:
        return (
          <div className="py-8 text-center text-muted-foreground">
            Unknown block type: {block_type}
          </div>
        );
    }
  };

  return (
    <>
      {anchorId && <div id={anchorId} className="scroll-mt-20" />}
      {renderBlock()}
      {showDivider && <SectionDivider variant="fade" />}
    </>
  );
};

export default BlockRenderer;
