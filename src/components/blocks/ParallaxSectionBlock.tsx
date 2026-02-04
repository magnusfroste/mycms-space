// ============================================
// Parallax Section Block
// Smooth parallax scrolling with layered content
// ============================================

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface ParallaxSectionBlockConfig {
  background_image?: string;
  foreground_image?: string;
  headline?: string;
  description?: string;
  parallax_speed?: number;
  height?: 'medium' | 'large' | 'full';
  overlay_color?: string;
  text_color?: 'light' | 'dark';
}

interface ParallaxSectionBlockProps {
  config: Record<string, unknown>;
}

const ParallaxSectionBlock: React.FC<ParallaxSectionBlockProps> = ({ config }) => {
  const settings = config as ParallaxSectionBlockConfig;
  const sectionRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  // Start visible immediately for editor preview (no scroll needed)
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        if (rect.top < windowHeight && rect.bottom > 0) {
          setIsVisible(true);
          const progress = (windowHeight - rect.top) / (windowHeight + rect.height);
          setScrollY(progress);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const heightClasses = {
    medium: 'min-h-[60vh]',
    large: 'min-h-[80vh]',
    full: 'min-h-screen',
  };

  const parallaxSpeed = settings.parallax_speed ?? 0.5;
  const bgTransform = `translateY(${scrollY * 100 * parallaxSpeed}px)`;
  const fgTransform = `translateY(${scrollY * 50 * parallaxSpeed}px)`;

  return (
    <section
      ref={sectionRef}
      className={cn(
        'relative overflow-hidden',
        heightClasses[settings.height || 'large']
      )}
    >
      {/* Background Layer */}
      <div
        className="absolute inset-0 w-full h-[120%] -top-[10%]"
        style={{
          transform: bgTransform,
          backgroundImage: `url(${settings.background_image || 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1920'})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: settings.overlay_color || 'linear-gradient(135deg, hsl(var(--background) / 0.9), hsl(var(--background) / 0.5))',
        }}
      />

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-primary/10 blur-3xl"
            style={{
              width: `${100 + i * 50}px`,
              height: `${100 + i * 50}px`,
              left: `${10 + i * 15}%`,
              top: `${20 + (i % 3) * 20}%`,
              transform: `translateY(${scrollY * (30 + i * 10)}px)`,
              opacity: isVisible ? 0.6 : 0,
              transition: 'opacity 0.5s ease',
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center justify-center px-6">
        <div
          className="max-w-4xl text-center space-y-8"
          style={{ transform: fgTransform }}
        >
          <h2 
            className={cn(
              'text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight',
              'opacity-0 translate-y-8 transition-all duration-700',
              isVisible && 'opacity-100 translate-y-0',
              settings.text_color === 'dark' ? 'text-foreground' : 'text-white'
            )}
          >
            {settings.headline || 'Immersive Experiences'}
          </h2>
          
          <p 
            className={cn(
              'text-lg md:text-xl lg:text-2xl max-w-2xl mx-auto',
              'opacity-0 translate-y-8 transition-all duration-700 delay-200',
              isVisible && 'opacity-100 translate-y-0',
              settings.text_color === 'dark' ? 'text-muted-foreground' : 'text-white/80'
            )}
          >
            {settings.description || 'Scroll to discover the magic of layered motion and depth perception.'}
          </p>

          {/* Decorative Line */}
          <div 
            className={cn(
              'w-24 h-1 mx-auto rounded-full bg-gradient-to-r from-transparent via-primary to-transparent',
              'opacity-0 scale-x-0 transition-all duration-700 delay-400',
              isVisible && 'opacity-100 scale-x-100'
            )}
          />
        </div>
      </div>

      {/* Foreground Image (if provided) */}
      {settings.foreground_image && (
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl"
          style={{ transform: `translateX(-50%) ${fgTransform}` }}
        >
          <img 
            src={settings.foreground_image} 
            alt="" 
            className="w-full h-auto"
          />
        </div>
      )}
    </section>
  );
};

export default ParallaxSectionBlock;
