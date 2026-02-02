// ============================================
// Text Section Block - 2026 Design System
// Clean typography with subtle backgrounds
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
    left: 'text-left items-start',
    center: 'text-center items-center',
    right: 'text-right items-end',
  };

  const backgroundClasses = {
    default: '',
    muted: 'bg-muted/30',
    card: 'bg-card',
  };

  return (
    <section className={cn('section-container-sm', backgroundClasses[background])}>
      <div className="container mx-auto px-4">
        <div className={cn('flex flex-col max-w-3xl', alignmentClasses[alignment], alignment === 'center' && 'mx-auto')}>
          {title && (
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-foreground tracking-tight animate-fade-in">
              {title}
            </h2>
          )}
          {content && (
            <p 
              className="text-lg md:text-xl leading-relaxed text-muted-foreground animate-fade-in"
              style={{ animationDelay: '0.1s' }}
            >
              {content}
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default TextSectionBlock;