// ============================================
// Block Renderer
// Routes each block_type to its corresponding component
// ============================================

import React from 'react';
import type { PageBlock } from '@/types';
import HeroBlock from './HeroBlock';
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

interface BlockRendererProps {
  block: PageBlock;
}

const BlockRenderer: React.FC<BlockRendererProps> = ({ block }) => {
  const { block_type, block_config } = block;

  switch (block_type) {
    case 'hero':
      return <HeroBlock config={block_config} />;
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
    default:
      return (
        <div className="py-8 text-center text-muted-foreground">
          Unknown block type: {block_type}
        </div>
      );
  }
};

export default BlockRenderer;
