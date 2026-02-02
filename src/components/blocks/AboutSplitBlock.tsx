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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            {/* Left Column - Image & Text */}
            <div className="lg:col-span-5 space-y-8">
              {imageUrl && (
                <div 
                  className="relative group animate-fade-in"
                  style={{ animationDelay: '0.2s' }}
                >
                  {/* Image Container */}
                  <div className="relative rounded-3xl overflow-hidden">
                    {/* Gradient Border Effect */}
                    <div className="absolute -inset-px bg-gradient-primary rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="relative bg-card rounded-3xl overflow-hidden p-1">
                      <img 
                        src={imageUrl} 
                        alt={name || "Profile"} 
                        className="w-full aspect-[4/5] object-cover rounded-2xl"
                      />
                      
                      {/* Overlay on hover */}
                      <div className="absolute inset-1 rounded-2xl bg-gradient-to-t from-background/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </div>
                  
                  {/* Floating Decoration */}
                  <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-2xl -z-10" />
                </div>
              )}
              
              {/* Text Content */}
              <div 
                className="space-y-6 animate-fade-in"
                style={{ animationDelay: '0.3s' }}
              >
                <p className="text-lg text-foreground/80 leading-relaxed">
                  {introText}
                </p>
                <p className="text-base text-muted-foreground leading-relaxed">
                  {additionalText}
                </p>
              </div>
            </div>
            
            {/* Right Column - Skills */}
            <div className="lg:col-span-7 space-y-5">
              {skills.map((skill, index) => (
                <article 
                  key={index} 
                  className="group elevated-card p-6 animate-fade-in"
                  style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                >
                  <div className="flex items-start gap-5">
                    {/* Icon */}
                    <div className="relative shrink-0">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/5 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                        <div className="text-primary">
                          {iconMap[skill.icon] || iconMap['Monitor']}
                        </div>
                      </div>
                      {/* Glow */}
                      <div className="absolute inset-0 rounded-2xl bg-primary/15 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-xl mb-2 group-hover:text-primary transition-colors">
                        {skill.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {skill.description}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default AboutSplitBlock;