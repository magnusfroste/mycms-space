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
} from 'lucide-react';

export type BlockType =
  | 'hero'
  | 'chat-widget'
  | 'text-section'
  | 'about-split'
  | 'featured-carousel'
  | 'expertise-grid'
  | 'project-showcase'
  | 'image-text'
  | 'cta-banner'
  | 'spacer';

interface BlockTypeOption {
  type: BlockType;
  label: string;
  icon: React.ReactNode;
  description: string;
  preview: React.ReactNode;
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

export const BLOCK_TYPE_OPTIONS: BlockTypeOption[] = [
  {
    type: 'hero',
    label: 'Hero',
    icon: <Layout className="h-4 w-4" />,
    description: 'Large header with tagline and features',
    preview: <HeroPreview />,
  },
  {
    type: 'chat-widget',
    label: 'Chat Widget',
    icon: <MessageSquare className="h-4 w-4" />,
    description: 'Interactive chat component',
    preview: <ChatPreview />,
  },
  {
    type: 'text-section',
    label: 'Text Section',
    icon: <Type className="h-4 w-4" />,
    description: 'Title and content block',
    preview: <TextSectionPreview />,
  },
  {
    type: 'about-split',
    label: 'About Split',
    icon: <Layers className="h-4 w-4" />,
    description: 'Two-column about section',
    preview: <AboutSplitPreview />,
  },
  {
    type: 'featured-carousel',
    label: 'Featured Carousel',
    icon: <ImageIcon className="h-4 w-4" />,
    description: 'Carousel of featured items',
    preview: <FeaturedPreview />,
  },
  {
    type: 'expertise-grid',
    label: 'Expertise Grid',
    icon: <Grid className="h-4 w-4" />,
    description: 'Grid of expertise areas',
    preview: <ExpertisePreview />,
  },
  {
    type: 'project-showcase',
    label: 'Project Showcase',
    icon: <Layers className="h-4 w-4" />,
    description: 'Portfolio project display',
    preview: <ProjectShowcasePreview />,
  },
  {
    type: 'image-text',
    label: 'Image + Text',
    icon: <ImageIcon className="h-4 w-4" />,
    description: 'Side-by-side image and text',
    preview: <ImageTextPreview />,
  },
  {
    type: 'cta-banner',
    label: 'CTA Banner',
    icon: <ArrowRight className="h-4 w-4" />,
    description: 'Call-to-action section',
    preview: <CtaBannerPreview />,
  },
  {
    type: 'spacer',
    label: 'Spacer',
    icon: <Minus className="h-4 w-4" />,
    description: 'Empty space for layout',
    preview: <SpacerPreview />,
  },
];

interface BlockTypePickerProps {
  value: BlockType;
  onChange: (type: BlockType) => void;
}

const BlockTypePicker: React.FC<BlockTypePickerProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Block Type</label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {BLOCK_TYPE_OPTIONS.map((option) => (
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
        ))}
      </div>
    </div>
  );
};

export default BlockTypePicker;
