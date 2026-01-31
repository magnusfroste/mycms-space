// ============================================
// Hero Block
// Reads hero data from block_config JSONB
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
    <section className="relative overflow-hidden">
      {/* Background Animations */}
      {enableAnimations && (
        <>
          {animationStyle === 'falling-stars' && <FallingStars />}
          {animationStyle === 'particles' && <ParticleField />}
          {animationStyle === 'gradient-shift' && <GradientShift />}
        </>
      )}

      {/* Content Layer */}
      <div className="relative z-10">
        <div
          className="flex flex-col justify-center py-20 relative"
          aria-labelledby="hero-heading"
        >
          {/* Background gradient circles */}
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary/20 rounded-full filter blur-3xl opacity-30"></div>
          <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-apple-blue/20 rounded-full filter blur-3xl opacity-30"></div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              {isLoading ? (
                <>
                  <Skeleton className="h-16 w-3/4 mx-auto mb-6" />
                  <Skeleton className="h-6 w-2/3 mx-auto mb-10" />
                  <div className="flex justify-center gap-8 mb-16">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex flex-col items-center">
                        <Skeleton className="h-12 w-12 rounded-full mb-2" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <h1
                    id="hero-heading"
                    className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-apple-purple to-apple-blue bg-clip-text text-transparent mb-6 animate-fade-in-slow"
                  >
                    {name}
                  </h1>

                  <p className="text-xl md:text-2xl text-muted-foreground mb-10 animate-fade-in">
                    {tagline}
                  </p>

                  {features.length > 0 && (
                    <div className="flex justify-center gap-8 mb-12 animate-fade-in">
                      {features.map((feature, index) => (
                        <div
                          key={index}
                          className="flex flex-col items-center"
                          aria-label={feature.text}
                        >
                          <div className={`w-12 h-12 rounded-full ${index % 2 === 0 ? 'bg-primary/20' : 'bg-apple-blue/20'} flex items-center justify-center mb-2`}>
                            {iconMap[feature.icon] || iconMap['Rocket']}
                          </div>
                          <span className="text-foreground/80">{feature.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBlock;
