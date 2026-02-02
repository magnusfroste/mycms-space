// ============================================
// Hero Block - 2026 Design System
// Modern, immersive hero with gradient text and floating elements
// ============================================

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { iconMap } from '@/lib/constants/iconMaps';
import FallingStars from '@/components/animations/FallingStars';
import ParticleField from '@/components/animations/ParticleField';
import GradientShift from '@/components/animations/GradientShift';
import type { HeroBlockConfig } from '@/types/blockConfigs';

interface HeroBlockProps {
  config: Record<string, unknown>;
}

const HeroBlock: React.FC<HeroBlockProps> = ({ config }) => {
  const typedConfig = config as HeroBlockConfig;
  
  const name = typedConfig.name || 'Your Name';
  const tagline = typedConfig.tagline || 'Your Tagline';
  const features = typedConfig.features || [];
  const enableAnimations = typedConfig.enable_animations ?? true;
  const animationStyle = typedConfig.animation_style || 'falling-stars';

  const isLoading = !typedConfig.name;

  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden">
      {/* Background Layer */}
      <div className="absolute inset-0 bg-mesh-gradient opacity-60" />
      
      {/* Animated Background */}
      {enableAnimations && (
        <div className="absolute inset-0 pointer-events-none">
          {animationStyle === 'falling-stars' && <FallingStars />}
          {animationStyle === 'particles' && <ParticleField />}
          {animationStyle === 'gradient-shift' && <GradientShift />}
        </div>
      )}

      {/* Floating Orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-gradient-to-br from-accent/15 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
      
      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center">
            {isLoading ? (
              <div className="space-y-6">
                <Skeleton className="h-20 w-3/4 mx-auto rounded-2xl" />
                <Skeleton className="h-8 w-2/3 mx-auto rounded-xl" />
                <div className="flex justify-center gap-8 pt-8">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex flex-col items-center gap-3">
                      <Skeleton className="h-16 w-16 rounded-2xl" />
                      <Skeleton className="h-4 w-24 rounded-lg" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Main Heading */}
                <h1
                  className="text-display-sm md:text-display lg:text-display-lg font-bold mb-6 animate-fade-in"
                  style={{ animationDelay: '0.1s' }}
                >
                  <span className="bg-gradient-primary bg-clip-text text-transparent">
                    {name}
                  </span>
                </h1>

                {/* Tagline */}
                <p 
                  className="text-xl md:text-2xl lg:text-3xl text-muted-foreground font-light mb-12 max-w-3xl mx-auto animate-fade-in"
                  style={{ animationDelay: '0.2s' }}
                >
                  {tagline}
                </p>

                {/* Features */}
                {features.length > 0 && (
                  <div 
                    className="flex flex-wrap justify-center gap-4 md:gap-8 animate-fade-in"
                    style={{ animationDelay: '0.3s' }}
                  >
                    {features.map((feature, index) => (
                      <div
                        key={index}
                        className="group relative"
                      >
                        <div className="glow-card p-5 flex flex-col items-center gap-3 min-w-[120px]">
                          {/* Icon Container */}
                          <div className="relative">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                              <div className="text-primary">
                                {iconMap[feature.icon] || iconMap['Rocket']}
                              </div>
                            </div>
                            {/* Glow effect on hover */}
                            <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                          </div>
                          
                          {/* Label */}
                          <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors">
                            {feature.text}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Scroll Indicator */}
                <div 
                  className="mt-16 animate-fade-in"
                  style={{ animationDelay: '0.5s' }}
                >
                  <div className="inline-flex flex-col items-center gap-2 text-muted-foreground/60">
                    <span className="text-xs uppercase tracking-widest">Scroll</span>
                    <div className="w-px h-12 bg-gradient-to-b from-muted-foreground/40 to-transparent" />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBlock;