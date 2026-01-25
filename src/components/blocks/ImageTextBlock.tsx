// ============================================
// Image Text Block
// Side-by-side image and text content
// ============================================

import React from 'react';
import { cn } from '@/lib/utils';

interface ImageTextBlockConfig {
  title?: string;
  content?: string;
  image_url?: string;
  image_position?: 'left' | 'right';
  background?: 'default' | 'muted' | 'card';
}

interface ImageTextBlockProps {
  config: Record<string, unknown>;
}

const ImageTextBlock: React.FC<ImageTextBlockProps> = ({ config }) => {
  const typedConfig = config as ImageTextBlockConfig;
  const {
    title,
    content,
    image_url,
    image_position = 'left',
    background = 'default',
  } = typedConfig;

  const backgroundClasses = {
    default: 'bg-background',
    muted: 'bg-muted/50',
    card: 'bg-card',
  };

  const imageOrder = image_position === 'right' ? 'md:order-2' : '';
  const textOrder = image_position === 'right' ? 'md:order-1' : '';

  return (
    <section className={cn('py-16', backgroundClasses[background])}>
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Image */}
          <div className={cn('relative', imageOrder)}>
            {image_url ? (
              <img
                src={image_url}
                alt={title || 'Content image'}
                className="w-full h-auto rounded-xl shadow-lg object-cover aspect-[4/3]"
              />
            ) : (
              <div className="w-full aspect-[4/3] bg-muted rounded-xl flex items-center justify-center">
                <span className="text-muted-foreground">No image</span>
              </div>
            )}
          </div>

          {/* Text Content */}
          <div className={cn('space-y-4', textOrder)}>
            {title && (
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                {title}
              </h2>
            )}
            {content && (
              <p className="text-lg leading-relaxed text-muted-foreground">
                {content}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ImageTextBlock;
