// ============================================
// Parallax Section Block
// Clean parallax with IntersectionObserver
// ============================================

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { MarkdownContent } from '@/components/common';

interface ParallaxSectionBlockConfig {
  background_image?: string;
  title?: string;
  content?: string;
  height?: 'sm' | 'md' | 'lg';
  text_color?: 'light' | 'dark';
}

interface ParallaxSectionBlockProps {
  config: Record<string, unknown>;
}

const ParallaxSectionBlock: React.FC<ParallaxSectionBlockProps> = ({ config }) => {
  const settings = config as ParallaxSectionBlockConfig;
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // IntersectionObserver for visibility detection
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const heightClasses: Record<string, string> = {
    sm: 'min-h-[40vh]',
    md: 'min-h-[60vh]',
    lg: 'min-h-[80vh]',
  };

  const isLight = settings.text_color !== 'dark';

  return (
    <section
      ref={sectionRef}
      className={cn(
        'relative overflow-hidden',
        heightClasses[settings.height || 'md']
      )}
    >
      {/* Background with CSS parallax */}
      {settings.background_image && (
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-fixed"
          style={{
            backgroundImage: `url(${settings.background_image})`,
          }}
        />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-background/70" />

      {/* Content */}
      <div className="relative z-10 h-full flex items-center justify-center px-6">
        <div
          className={cn(
            'max-w-3xl text-center space-y-6',
            'opacity-0 translate-y-6 transition-all duration-700 ease-out',
            isVisible && 'opacity-100 translate-y-0'
          )}
        >
          {settings.title && (
            <h2
              className={cn(
                'text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight',
                isLight ? 'text-white' : 'text-foreground'
              )}
            >
              {settings.title}
            </h2>
          )}

          {settings.content && (
            <div
              className={cn(
                'text-lg md:text-xl max-w-2xl mx-auto leading-relaxed',
                'opacity-0 translate-y-4 transition-all duration-700 delay-200 ease-out',
                isVisible && 'opacity-100 translate-y-0',
                isLight ? 'text-white/80' : 'text-muted-foreground'
              )}
            >
              <MarkdownContent content={settings.content} />
            </div>
          )}

          {/* Decorative line */}
          <div
            className={cn(
              'w-16 h-0.5 mx-auto rounded-full bg-primary',
              'opacity-0 scale-x-0 transition-all duration-700 delay-400 ease-out',
              isVisible && 'opacity-100 scale-x-100'
            )}
          />
        </div>
      </div>
    </section>
  );
};

export default ParallaxSectionBlock;
