// ============================================
// Text Section Block
// Simple title + content block with alignment options
// ============================================

import React from 'react';
import { cn } from '@/lib/utils';

interface TextSectionBlockConfig {
  title?: string;
  content?: string;
  alignment?: 'left' | 'center' | 'right';
  background?: 'default' | 'muted' | 'card';
}

interface TextSectionBlockProps {
  config: Record<string, unknown>;
}

const TextSectionBlock: React.FC<TextSectionBlockProps> = ({ config }) => {
  const typedConfig = config as TextSectionBlockConfig;
  const { title, content, alignment = 'center', background = 'default' } = typedConfig;

  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  const backgroundClasses = {
    default: 'bg-background',
    muted: 'bg-muted/50',
    card: 'bg-card',
  };

  return (
    <section className={cn('py-16', backgroundClasses[background])}>
      <div className="container mx-auto px-4">
        <div className={cn('max-w-3xl mx-auto', alignmentClasses[alignment])}>
          {title && (
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
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
    </section>
  );
};

export default TextSectionBlock;
