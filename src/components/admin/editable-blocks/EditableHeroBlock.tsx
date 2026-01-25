// ============================================
// Editable Hero Block
// Inline editing for hero section content
// ============================================

import React from 'react';
import { cn } from '@/lib/utils';
import { iconMap } from '@/lib/constants/iconMaps';
import type { HeroSettings } from '@/types';
import EditableText from './EditableText';
import FallingStars from '@/components/animations/FallingStars';
import ParticleField from '@/components/animations/ParticleField';
import GradientShift from '@/components/animations/GradientShift';

interface EditableHeroBlockProps {
  config: Record<string, unknown>;
  heroData?: HeroSettings | null;
  pendingChanges?: Record<string, unknown>;
  isEditMode: boolean;
  onChange: (changes: Record<string, unknown>) => void;
}

const EditableHeroBlock: React.FC<EditableHeroBlockProps> = ({
  config,
  heroData,
  pendingChanges = {},
  isEditMode,
  onChange,
}) => {
  const showAnimations = (config.show_animations as boolean) ?? heroData?.enable_animations ?? true;
  
  // Merge heroData with pending changes
  const currentName = (pendingChanges.name as string) ?? heroData?.name ?? 'Magnus Froste';
  const currentTagline = (pendingChanges.tagline as string) ?? heroData?.tagline ?? 'Innovation Strategist & AI Integration Expert';
  const currentFeature1 = (pendingChanges.feature1 as string) ?? heroData?.feature1 ?? 'Innovation';
  const currentFeature2 = (pendingChanges.feature2 as string) ?? heroData?.feature2 ?? 'Strategy';
  const currentFeature3 = (pendingChanges.feature3 as string) ?? heroData?.feature3 ?? 'AI Integration';

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
        <div
          className="flex flex-col justify-center py-20 relative"
          aria-labelledby="hero-heading"
        >
          {/* Background gradient circles */}
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary/20 rounded-full filter blur-3xl opacity-30" />
          <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-apple-blue/20 rounded-full filter blur-3xl opacity-30" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h1
                id="hero-heading"
                className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-apple-purple to-apple-blue bg-clip-text text-transparent mb-6 animate-fade-in-slow"
              >
                <EditableText
                  value={currentName}
                  isEditMode={isEditMode}
                  onChange={(value) => onChange({ name: value })}
                  className="bg-gradient-to-r from-apple-purple to-apple-blue bg-clip-text text-transparent"
                  placeholder="Ditt namn"
                />
              </h1>

              <p className="text-xl md:text-2xl text-muted-foreground mb-10 animate-fade-in">
                <EditableText
                  value={currentTagline}
                  isEditMode={isEditMode}
                  onChange={(value) => onChange({ tagline: value })}
                  placeholder="Din tagline"
                />
              </p>

              <div className="flex justify-center gap-8 mb-12 animate-fade-in">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                    {iconMap[heroData?.feature1_icon || 'Rocket']}
                  </div>
                  <span className="text-foreground/80">
                    <EditableText
                      value={currentFeature1}
                      isEditMode={isEditMode}
                      onChange={(value) => onChange({ feature1: value })}
                      placeholder="Feature 1"
                    />
                  </span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-apple-blue/20 flex items-center justify-center mb-2">
                    {iconMap[heroData?.feature2_icon || 'BarChart']}
                  </div>
                  <span className="text-foreground/80">
                    <EditableText
                      value={currentFeature2}
                      isEditMode={isEditMode}
                      onChange={(value) => onChange({ feature2: value })}
                      placeholder="Feature 2"
                    />
                  </span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                    {iconMap[heroData?.feature3_icon || 'Brain']}
                  </div>
                  <span className="text-foreground/80">
                    <EditableText
                      value={currentFeature3}
                      isEditMode={isEditMode}
                      onChange={(value) => onChange({ feature3: value })}
                      placeholder="Feature 3"
                    />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EditableHeroBlock;
