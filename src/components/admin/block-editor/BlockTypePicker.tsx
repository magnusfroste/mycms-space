// ============================================
// Block Type Picker with Visual Previews
// Grid of block types with thumbnail previews
// ============================================

import React from 'react';
import { cn } from '@/lib/utils';
import {
  Layout,
  MessageSquare,
  Type,
  Layers,
  Image as ImageIcon,
  Grid,
  ArrowRight,
  Minus,
  Video,
  Mountain,
  LayoutGrid,
  ScrollText,
  BarChart3,
  Quote,
  Mail,
} from 'lucide-react';
import type { BlockType } from '@/types';

// Re-export BlockType from central types
export type { BlockType } from '@/types';

interface BlockTypeOption {
  type: BlockType;
  label: string;
  icon: React.ReactNode;
  description: string;
  preview: React.ReactNode;
  category?: 'basic' | 'advanced' | '2026';
}

// Mini preview components for each block type
const HeroPreview = () => (
  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 rounded flex flex-col items-center justify-center gap-1 p-2">
    <div className="w-8 h-1.5 bg-primary/40 rounded" />
    <div className="w-12 h-1 bg-muted-foreground/30 rounded" />
    <div className="flex gap-1 mt-1">
      <div className="w-4 h-3 bg-primary/30 rounded-sm" />
      <div className="w-4 h-3 bg-primary/30 rounded-sm" />
      <div className="w-4 h-3 bg-primary/30 rounded-sm" />
    </div>
  </div>
);

const ChatPreview = () => (
  <div className="w-full h-full bg-muted/50 rounded flex flex-col justify-end p-2 gap-1">
    <div className="flex gap-1">
      <div className="w-6 h-2 bg-muted-foreground/20 rounded-full" />
    </div>
    <div className="flex gap-1 justify-end">
      <div className="w-8 h-2 bg-primary/40 rounded-full" />
    </div>
    <div className="w-full h-3 bg-background border rounded-full" />
  </div>
);

const TextSectionPreview = () => (
  <div className="w-full h-full bg-muted/30 rounded flex flex-col items-center justify-center gap-1 p-2">
    <div className="w-10 h-1.5 bg-foreground/30 rounded" />
    <div className="w-full space-y-0.5">
      <div className="w-full h-0.5 bg-muted-foreground/20 rounded" />
      <div className="w-3/4 h-0.5 bg-muted-foreground/20 rounded" />
      <div className="w-5/6 h-0.5 bg-muted-foreground/20 rounded" />
    </div>
  </div>
);

const AboutSplitPreview = () => (
  <div className="w-full h-full bg-muted/30 rounded flex gap-1 p-2">
    <div className="flex-1 bg-muted rounded" />
    <div className="flex-1 flex flex-col gap-0.5 justify-center">
      <div className="w-full h-1 bg-foreground/20 rounded" />
      <div className="w-3/4 h-0.5 bg-muted-foreground/20 rounded" />
      <div className="w-full h-0.5 bg-muted-foreground/20 rounded" />
    </div>
  </div>
);

const FeaturedPreview = () => (
  <div className="w-full h-full bg-muted/30 rounded flex gap-1 p-2 items-center">
    <div className="w-1 h-full bg-muted-foreground/20 rounded" />
    <div className="flex-1 flex gap-1">
      <div className="flex-1 h-6 bg-muted rounded" />
      <div className="flex-1 h-6 bg-muted rounded" />
      <div className="flex-1 h-6 bg-muted rounded" />
    </div>
    <div className="w-1 h-full bg-muted-foreground/20 rounded" />
  </div>
);

const ExpertisePreview = () => (
  <div className="w-full h-full bg-muted/30 rounded grid grid-cols-3 gap-1 p-2">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="bg-muted rounded flex items-center justify-center">
        <div className="w-2 h-2 bg-primary/30 rounded-full" />
      </div>
    ))}
  </div>
);

const ProjectShowcasePreview = () => (
  <div className="w-full h-full bg-muted/30 rounded flex flex-col gap-1 p-2">
    <div className="w-8 h-1 bg-foreground/20 rounded mx-auto" />
    <div className="flex-1 grid grid-cols-2 gap-1">
      <div className="bg-muted rounded" />
      <div className="bg-muted rounded" />
    </div>
  </div>
);

const ImageTextPreview = () => (
  <div className="w-full h-full bg-muted/30 rounded flex gap-1 p-2">
    <div className="w-1/2 bg-muted rounded flex items-center justify-center">
      <ImageIcon className="w-3 h-3 text-muted-foreground/40" />
    </div>
    <div className="w-1/2 flex flex-col gap-0.5 justify-center">
      <div className="w-full h-1 bg-foreground/20 rounded" />
      <div className="w-3/4 h-0.5 bg-muted-foreground/20 rounded" />
      <div className="w-full h-0.5 bg-muted-foreground/20 rounded" />
    </div>
  </div>
);

const CtaBannerPreview = () => (
  <div className="w-full h-full bg-gradient-to-r from-primary/20 to-primary/10 rounded flex items-center justify-center gap-2 p-2">
    <div className="w-8 h-1 bg-foreground/30 rounded" />
    <div className="w-6 h-3 bg-primary/40 rounded" />
  </div>
);

const SpacerPreview = () => (
  <div className="w-full h-full bg-muted/20 rounded border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
    <Minus className="w-4 h-4 text-muted-foreground/30" />
  </div>
);

// New 2026 block previews
const VideoHeroPreview = () => (
  <div className="w-full h-full bg-gradient-to-br from-purple-500/30 to-blue-500/20 rounded flex flex-col items-center justify-center gap-1 p-2 relative overflow-hidden">
    <Video className="w-4 h-4 text-primary/50 absolute top-1 right-1" />
    <div className="w-10 h-1.5 bg-white/40 rounded" />
    <div className="w-8 h-1 bg-white/20 rounded" />
    <div className="absolute bottom-1 right-1 w-3 h-3 border border-white/30 rounded-full" />
  </div>
);

const ParallaxPreview = () => (
  <div className="w-full h-full bg-gradient-to-b from-blue-500/20 to-purple-500/20 rounded flex flex-col items-center justify-center gap-1 p-2 relative overflow-hidden">
    <Mountain className="w-6 h-6 text-primary/30 absolute bottom-0" />
    <div className="w-8 h-1.5 bg-white/50 rounded z-10" />
    <div className="w-6 h-1 bg-white/30 rounded z-10" />
  </div>
);

const BentoPreview = () => (
  <div className="w-full h-full bg-muted/30 rounded grid grid-cols-3 grid-rows-2 gap-0.5 p-1">
    <div className="col-span-2 row-span-2 bg-gradient-to-br from-purple-500/20 to-pink-500/10 rounded" />
    <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/10 rounded" />
    <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 rounded" />
  </div>
);

const MarqueePreview = () => (
  <div className="w-full h-full bg-muted/20 rounded flex flex-col justify-center gap-1 p-2 overflow-hidden">
    <div className="flex gap-2 animate-pulse">
      <div className="w-8 h-2 bg-foreground/10 rounded" />
      <div className="w-6 h-2 bg-foreground/10 rounded" />
      <div className="w-10 h-2 bg-foreground/10 rounded" />
    </div>
    <div className="flex gap-2">
      <div className="w-6 h-2 bg-primary/20 rounded" />
      <div className="w-10 h-2 bg-primary/20 rounded" />
      <div className="w-8 h-2 bg-primary/20 rounded" />
    </div>
  </div>
);

const StatsPreview = () => (
  <div className="w-full h-full bg-muted/30 rounded flex gap-1 p-2 items-center justify-center">
    <div className="flex flex-col items-center gap-0.5">
      <div className="text-[8px] font-bold text-primary">150+</div>
      <div className="w-4 h-0.5 bg-muted-foreground/20 rounded" />
    </div>
    <div className="flex flex-col items-center gap-0.5">
      <div className="text-[8px] font-bold text-primary">98%</div>
      <div className="w-4 h-0.5 bg-muted-foreground/20 rounded" />
    </div>
    <div className="flex flex-col items-center gap-0.5">
      <div className="text-[8px] font-bold text-primary">24/7</div>
      <div className="w-4 h-0.5 bg-muted-foreground/20 rounded" />
    </div>
  </div>
);

const TestimonialPreview = () => (
  <div className="w-full h-full bg-muted/30 rounded flex flex-col items-center justify-center gap-1 p-2">
    <Quote className="w-3 h-3 text-primary/30" />
    <div className="w-10 h-0.5 bg-muted-foreground/20 rounded" />
    <div className="w-8 h-0.5 bg-muted-foreground/20 rounded" />
    <div className="w-4 h-4 bg-muted rounded-full mt-1" />
  </div>
);

const NewsletterPreview = () => (
  <div className="w-full h-full bg-muted/30 rounded flex flex-col items-center justify-center gap-1 p-2">
    <Mail className="w-4 h-4 text-primary/40" />
    <div className="w-10 h-0.5 bg-muted-foreground/20 rounded" />
    <div className="flex gap-1 mt-1">
      <div className="flex-1 h-2 bg-background border rounded" />
      <div className="w-4 h-2 bg-primary/40 rounded" />
    </div>
  </div>
);

export const BLOCK_TYPE_OPTIONS: BlockTypeOption[] = [
  // Basic blocks
  {
    type: 'hero',
    label: 'Hero',
    icon: <Layout className="h-4 w-4" />,
    description: 'Large header with tagline and features',
    preview: <HeroPreview />,
    category: 'basic',
  },
  {
    type: 'chat-widget',
    label: 'Chat Widget',
    icon: <MessageSquare className="h-4 w-4" />,
    description: 'Interactive chat component',
    preview: <ChatPreview />,
    category: 'basic',
  },
  {
    type: 'text-section',
    label: 'Text Section',
    icon: <Type className="h-4 w-4" />,
    description: 'Title and content block',
    preview: <TextSectionPreview />,
    category: 'basic',
  },
  {
    type: 'about-split',
    label: 'About Split',
    icon: <Layers className="h-4 w-4" />,
    description: 'Two-column about section',
    preview: <AboutSplitPreview />,
    category: 'basic',
  },
  {
    type: 'featured-carousel',
    label: 'Featured Carousel',
    icon: <ImageIcon className="h-4 w-4" />,
    description: 'Carousel of featured items',
    preview: <FeaturedPreview />,
    category: 'basic',
  },
  {
    type: 'expertise-grid',
    label: 'Expertise Grid',
    icon: <Grid className="h-4 w-4" />,
    description: 'Grid of expertise areas',
    preview: <ExpertisePreview />,
    category: 'basic',
  },
  {
    type: 'project-showcase',
    label: 'Project Showcase',
    icon: <Layers className="h-4 w-4" />,
    description: 'Portfolio project display',
    preview: <ProjectShowcasePreview />,
    category: 'basic',
  },
  {
    type: 'image-text',
    label: 'Image + Text',
    icon: <ImageIcon className="h-4 w-4" />,
    description: 'Side-by-side image and text',
    preview: <ImageTextPreview />,
    category: 'basic',
  },
  {
    type: 'cta-banner',
    label: 'CTA Banner',
    icon: <ArrowRight className="h-4 w-4" />,
    description: 'Call-to-action section',
    preview: <CtaBannerPreview />,
    category: 'basic',
  },
  {
    type: 'spacer',
    label: 'Spacer',
    icon: <Minus className="h-4 w-4" />,
    description: 'Empty space for layout',
    preview: <SpacerPreview />,
    category: 'basic',
  },
  // 2026 Premium blocks
  {
    type: 'video-hero',
    label: 'Video Hero ✨',
    icon: <Video className="h-4 w-4" />,
    description: 'Fullscreen video background with overlay',
    preview: <VideoHeroPreview />,
    category: '2026',
  },
  {
    type: 'parallax-section',
    label: 'Parallax ✨',
    icon: <Mountain className="h-4 w-4" />,
    description: 'Immersive parallax scrolling effect',
    preview: <ParallaxPreview />,
    category: '2026',
  },
  {
    type: 'bento-grid',
    label: 'Bento Grid ✨',
    icon: <LayoutGrid className="h-4 w-4" />,
    description: 'Modern asymmetric grid (Apple style)',
    preview: <BentoPreview />,
    category: '2026',
  },
  {
    type: 'marquee',
    label: 'Marquee ✨',
    icon: <ScrollText className="h-4 w-4" />,
    description: 'Infinite scrolling text/logo ticker',
    preview: <MarqueePreview />,
    category: '2026',
  },
  {
    type: 'stats-counter',
    label: 'Stats Counter ✨',
    icon: <BarChart3 className="h-4 w-4" />,
    description: 'Animated statistics with counting',
    preview: <StatsPreview />,
    category: '2026',
  },
  {
    type: 'testimonial-carousel',
    label: 'Testimonials ✨',
    icon: <Quote className="h-4 w-4" />,
    description: '3D carousel with testimonials',
    preview: <TestimonialPreview />,
    category: '2026',
  },
  {
    type: 'newsletter-subscribe',
    label: 'Newsletter ✨',
    icon: <Mail className="h-4 w-4" />,
    description: 'Email subscription form',
    preview: <NewsletterPreview />,
    category: '2026',
  },
];

interface BlockTypePickerProps {
  value: BlockType;
  onChange: (type: BlockType) => void;
}

const BlockTypePicker: React.FC<BlockTypePickerProps> = ({ value, onChange }) => {
  const basicBlocks = BLOCK_TYPE_OPTIONS.filter(o => o.category !== '2026');
  const premiumBlocks = BLOCK_TYPE_OPTIONS.filter(o => o.category === '2026');

  const renderBlockOption = (option: BlockTypeOption) => (
    <button
      key={option.type}
      type="button"
      onClick={() => onChange(option.type)}
      className={cn(
        'relative group flex flex-col rounded-lg border-2 p-3 text-left transition-all hover:border-primary/50 hover:bg-accent/50',
        value === option.type
          ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
          : 'border-muted bg-card'
      )}
    >
      {/* Preview thumbnail */}
      <div className="aspect-video w-full mb-2 overflow-hidden rounded">
        {option.preview}
      </div>

      {/* Label and icon */}
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'text-muted-foreground transition-colors',
            value === option.type && 'text-primary'
          )}
        >
          {option.icon}
        </span>
        <span
          className={cn(
            'text-sm font-medium',
            value === option.type && 'text-primary'
          )}
        >
          {option.label}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
        {option.description}
      </p>

      {/* Selected indicator */}
      {value === option.type && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
      )}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Basic Blocks */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Basic Blocks</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {basicBlocks.map(renderBlockOption)}
        </div>
      </div>

      {/* Premium 2026 Blocks */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">2026 Premium Blocks</label>
          <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full">
            NEW
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {premiumBlocks.map(renderBlockOption)}
        </div>
      </div>
    </div>
  );
};

export default BlockTypePicker;
