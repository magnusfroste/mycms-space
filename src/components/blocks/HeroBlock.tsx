// ============================================
// Hero Block
// Wrapper for Hero component with optional animations
// ============================================

import React from 'react';
import Hero from '@/components/Hero';
import FallingStars from '@/components/animations/FallingStars';
import ParticleField from '@/components/animations/ParticleField';
import GradientShift from '@/components/animations/GradientShift';
import { useHeroSettings } from '@/hooks/useHeroSettings';

interface HeroBlockConfig {
  data_source?: string;
  show_animations?: boolean;
}

interface HeroBlockProps {
  config: Record<string, unknown>;
}

const HeroBlock: React.FC<HeroBlockProps> = ({ config }) => {
  const typedConfig = config as HeroBlockConfig;
  const { data: heroData } = useHeroSettings();
  const showAnimations = typedConfig.show_animations ?? heroData?.enable_animations ?? true;

  return (
    <section className="relative overflow-hidden">
      {/* Background Animations */}
      {showAnimations && heroData?.enable_animations && (
        <>
          {heroData.animation_style === 'falling-stars' && <FallingStars />}
          {heroData.animation_style === 'particles' && <ParticleField />}
          {heroData.animation_style === 'gradient-shift' && <GradientShift />}
        </>
      )}

      {/* Content Layer */}
      <div className="relative z-10">
        <Hero />
      </div>
    </section>
  );
};

export default HeroBlock;
