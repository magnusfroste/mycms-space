// ============================================
// About Split Block - 2026 Design System
// Modern asymmetric layout with editorial feel
// ============================================

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { iconMap } from '@/lib/constants/iconMaps';
import type { AboutSplitBlockConfig } from '@/types/blockConfigs';

interface AboutSplitBlockProps {
  config: Record<string, unknown>;
}

const AboutSplitBlock: React.FC<AboutSplitBlockProps> = ({ config }) => {
  const typedConfig = config as AboutSplitBlockConfig;
  
  const name = typedConfig.name;
  const introText = typedConfig.intro_text || 'Introduction text...';
  const additionalText = typedConfig.additional_text || 'Additional text...';
  const imageUrl = typedConfig.image_url;
  const skills = typedConfig.skills || [];

  const isLoading = !typedConfig.name;

  return (
    <section id="about" className="section-container relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/30 to-transparent" />
      
      <div className="container mx-auto px-4 relative">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-sm font-medium text-primary uppercase tracking-widest mb-4 animate-fade-in">
            About
          </span>
          <h2 className="section-title-gradient animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Who I Am
          </h2>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Skeleton className="h-6 w-full rounded-lg" />
              <Skeleton className="h-6 w-5/6 rounded-lg" />
              <Skeleton className="h-6 w-4/5 rounded-lg" />
            </div>
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-2xl" />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Top Row - Image + Intro Text Side by Side */}
            <div 
              className="flex flex-col sm:flex-row gap-6 lg:gap-10 items-start animate-fade-in"
              style={{ animationDelay: '0.2s' }}
            >
              {/* Small Image */}
              {imageUrl && (
                <div className="relative group shrink-0">
                  <div className="relative w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 rounded-2xl overflow-hidden">
                    <div className="absolute -inset-px bg-gradient-primary rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative bg-card rounded-2xl overflow-hidden p-0.5 h-full">
                      <img 
                        src={imageUrl} 
                        alt={name || "Profile"} 
                        className="w-full h-full object-cover rounded-xl"
                      />
                    </div>
                  </div>
                  {/* Subtle Glow */}
                  <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-xl -z-10" />
                </div>
              )}
              
              {/* Text Content */}
              <div className="flex-1 space-y-4">
                <p className="text-lg lg:text-xl text-foreground/90 leading-relaxed">
                  {introText}
                </p>
                {additionalText && additionalText !== 'Additional text...' && (
                  <p className="text-base text-muted-foreground leading-relaxed">
                    {additionalText}
                  </p>
                )}
              </div>
            </div>
            
            {/* Skills Grid */}
            {skills.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
                {skills.map((skill, index) => (
                  <article 
                    key={index} 
                    className="group elevated-card p-5 animate-fade-in"
                    style={{ animationDelay: `${0.3 + index * 0.08}s` }}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="relative shrink-0">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/5 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                          <div className="text-primary">
                            {iconMap[skill.icon] || iconMap['Monitor']}
                          </div>
                        </div>
                        <div className="absolute inset-0 rounded-xl bg-primary/15 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                          {skill.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {skill.description}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default AboutSplitBlock;