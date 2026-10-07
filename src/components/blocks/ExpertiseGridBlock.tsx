// ============================================
// Expertise Grid Block - 2026 Design System
// Services & offerings with optional CTAs
// ============================================

import React from 'react';
import { Lightbulb, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { iconMap } from '@/lib/constants/iconMaps';
import type { ExpertiseGridBlockConfig } from '@/types/blockConfigs';

interface ExpertiseGridBlockProps {
  config: Record<string, unknown>;
}

const ExpertiseGridBlock: React.FC<ExpertiseGridBlockProps> = ({ config }) => {
  const typedConfig = config as ExpertiseGridBlockConfig;
  
  const title = typedConfig.title || 'What I Do';
  const subtitle = typedConfig.subtitle;
  const columns = typedConfig.columns || 3;
  const items = typedConfig.items?.filter(item => item.enabled) || [];

  const isLoading = !typedConfig.items;

  // Bento layout: pairs of wide (8) + narrow (4) cards on desktop
  const useBento = columns !== 2;
  const gridCols = useBento
    ? 'md:grid-cols-12'
    : 'md:grid-cols-2';

  const bentoSpan = (index: number) => {
    const pos = index % 4;
    if (pos === 0) return 'md:col-span-12 lg:col-span-8';
    if (pos === 1) return 'md:col-span-6 lg:col-span-4';
    if (pos === 2) return 'md:col-span-6 lg:col-span-4';
    return 'md:col-span-12 lg:col-span-8';
  };

  // Every 4th card (the wide closer) becomes a gradient feature card
  const isFeature = (index: number) => index % 4 === 3;

  return (
    <section id="services" className="section-container relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/50 via-muted/30 to-transparent" />
      
      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-sm font-medium text-primary uppercase tracking-widest mb-4 animate-fade-in">
            Services
          </span>
          <h2 
            className="section-title animate-fade-in" 
            style={{ animationDelay: '0.1s' }}
          >
            {title}
          </h2>
          {subtitle && (
            <p 
              className="section-subtitle mt-4 animate-fade-in"
              style={{ animationDelay: '0.2s' }}
            >
              {subtitle}
            </p>
          )}
        </div>
        
        {isLoading ? (
          <div className={`grid grid-cols-1 ${gridCols} gap-6`}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className={`grid grid-cols-1 ${gridCols} gap-6`}>
            {items.map((area, index) => (
              <article
                key={area.id}
                className={cn(
                  "group p-8 animate-fade-in flex flex-col rounded-3xl transition-all duration-500",
                  useBento && bentoSpan(index),
                  isFeature(index) && useBento
                    ? "bg-gradient-to-br from-primary to-secondary border border-primary/30 hover:shadow-glow-lg"
                    : "glow-card hover:-translate-y-1"
                )}
                style={{ animationDelay: `${0.1 + index * 0.05}s` }}
              >
                {/* Icon */}
                <div className="relative mb-6">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300",
                    isFeature(index) && useBento
                      ? "bg-white/20 text-white"
                      : "bg-primary/15 text-primary"
                  )}>
                    {iconMap[area.icon] || <Lightbulb className="h-6 w-6" />}
                  </div>
                  {!(isFeature(index) && useBento) && (
                    <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                  )}
                </div>

                {/* Content */}
                <h3 className={cn(
                  "text-xl font-semibold mb-3 transition-colors duration-300",
                  isFeature(index) && useBento ? "text-white text-2xl" : "group-hover:text-primary"
                )}>
                  {area.title}
                </h3>
                <p className={cn(
                  "leading-relaxed flex-1",
                  isFeature(index) && useBento ? "text-white/80" : "text-muted-foreground"
                )}>
                  {area.description}
                </p>

                {/* CTA Link */}
                {area.cta_text && area.cta_link && (
                  <a 
                    href={area.cta_link}
                    className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-primary hover:underline group/link"
                  >
                    {area.cta_text}
                    <ArrowRight className="h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
                  </a>
                )}

                {/* Decorative corner */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ExpertiseGridBlock;