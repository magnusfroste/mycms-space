// ============================================
// Marquee Block
// Infinite scrolling ticker/logo wall
// ============================================

import React from 'react';
import { cn } from '@/lib/utils';

interface MarqueeItem {
  id: string;
  text?: string;
  image_url?: string;
  link?: string;
}

interface MarqueeBlockConfig {
  headline?: string;
  items?: MarqueeItem[];
  speed?: 'slow' | 'medium' | 'fast';
  direction?: 'left' | 'right';
  pause_on_hover?: boolean;
  variant?: 'text' | 'logos' | 'mixed';
  show_gradient?: boolean;
}

interface MarqueeBlockProps {
  config: Record<string, unknown>;
}

const defaultItems: MarqueeItem[] = [
  { id: '1', text: 'Innovation' },
  { id: '2', text: 'Design' },
  { id: '3', text: 'Technology' },
  { id: '4', text: 'Creativity' },
  { id: '5', text: 'Experience' },
  { id: '6', text: 'Quality' },
  { id: '7', text: 'Excellence' },
  { id: '8', text: 'Vision' },
];

const MarqueeBlock: React.FC<MarqueeBlockProps> = ({ config }) => {
  const settings = config as MarqueeBlockConfig;
  const items = settings.items || defaultItems;
  
  const speedDuration = {
    slow: '40s',
    medium: '25s',
    fast: '15s',
  };

  const duration = speedDuration[settings.speed || 'medium'];
  const direction = settings.direction === 'right' ? 'reverse' : 'normal';

  // Duplicate items for seamless loop
  const duplicatedItems = [...items, ...items, ...items, ...items];

  return (
    <section className="py-16 overflow-hidden">
      {/* Headline */}
      {settings.headline && (
        <h3 className="text-center text-sm font-medium text-muted-foreground uppercase tracking-widest mb-8">
          {settings.headline}
        </h3>
      )}

      {/* Marquee Container */}
      <div className="relative">
        {/* Gradient Masks */}
        {settings.show_gradient !== false && (
          <>
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
          </>
        )}

        {/* Marquee Track */}
        <div
          className={cn(
            'flex items-center gap-8 md:gap-16',
            settings.pause_on_hover !== false && 'hover:[animation-play-state:paused]'
          )}
          style={{
            animation: `marquee ${duration} linear infinite`,
            animationDirection: direction,
          }}
        >
          {duplicatedItems.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="flex-shrink-0"
            >
              {settings.variant === 'logos' && item.image_url ? (
                // Logo variant
                <div className="w-24 h-12 md:w-32 md:h-16 flex items-center justify-center grayscale hover:grayscale-0 opacity-50 hover:opacity-100 transition-all duration-300">
                  <img 
                    src={item.image_url} 
                    alt={item.text || ''} 
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : (
                // Text variant
                <span className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground/10 hover:text-foreground/30 transition-colors duration-300 whitespace-nowrap">
                  {item.text}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Second row (reverse direction) for visual interest */}
      <div className="relative mt-4">
        {settings.show_gradient !== false && (
          <>
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
          </>
        )}

        <div
          className={cn(
            'flex items-center gap-8 md:gap-16',
            settings.pause_on_hover !== false && 'hover:[animation-play-state:paused]'
          )}
          style={{
            animation: `marquee ${duration} linear infinite`,
            animationDirection: direction === 'normal' ? 'reverse' : 'normal',
          }}
        >
          {[...duplicatedItems].reverse().map((item, index) => (
            <div
              key={`reverse-${item.id}-${index}`}
              className="flex-shrink-0"
            >
              {settings.variant === 'logos' && item.image_url ? (
                <div className="w-24 h-12 md:w-32 md:h-16 flex items-center justify-center grayscale hover:grayscale-0 opacity-50 hover:opacity-100 transition-all duration-300">
                  <img 
                    src={item.image_url} 
                    alt={item.text || ''} 
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : (
                <span className="text-3xl md:text-5xl lg:text-6xl font-bold text-primary/20 hover:text-primary/40 transition-colors duration-300 whitespace-nowrap">
                  {item.text}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </section>
  );
};

export default MarqueeBlock;
