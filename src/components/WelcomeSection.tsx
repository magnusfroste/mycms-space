import React from 'react';
import Hero from './Hero';
import ChatLanding from './ChatLanding';
import FallingStars from './animations/FallingStars';
import ParticleField from './animations/ParticleField';
import GradientShift from './animations/GradientShift';
import { useHeroSettings } from '@/hooks/useHeroSettings';

const WelcomeSection = () => {
  const { data: heroData } = useHeroSettings();

  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Background Animations - Spanning entire welcome area */}
      {heroData?.enable_animations && (
        <>
          {heroData.animation_style === 'falling-stars' && <FallingStars />}
          {heroData.animation_style === 'particles' && <ParticleField />}
          {heroData.animation_style === 'gradient-shift' && <GradientShift />}
        </>
      )}

      {/* Content Layer */}
      <div className="relative z-10">
        <Hero />
        <ChatLanding />
      </div>
    </section>
  );
};

export default WelcomeSection;
