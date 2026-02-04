// ============================================
// Values Block - 2026 Design System
// Core beliefs and work philosophy
// ============================================

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { iconMap } from '@/lib/constants/iconMaps';
import { Heart } from 'lucide-react';
import type { ValuesBlockConfig } from '@/types/blockConfigs';

interface ValuesBlockProps {
  config: Record<string, unknown>;
}

const ValuesBlock: React.FC<ValuesBlockProps> = ({ config }) => {
  const typedConfig = config as ValuesBlockConfig;
  
  const title = typedConfig.title || 'My Values';
  const subtitle = typedConfig.subtitle;
  const layout = typedConfig.layout || 'grid';
  const values = typedConfig.values?.filter(v => v.enabled) || [];

  const isLoading = !typedConfig.values;

  return (
    <section id="values" className="section-container relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/20 to-transparent" />
      
      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block text-sm font-medium text-primary uppercase tracking-widest mb-4 animate-fade-in">
            Values
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        ) : layout === 'grid' ? (
          // Grid layout - 2-4 columns depending on count
          <div className={`grid grid-cols-1 ${values.length <= 2 ? 'md:grid-cols-2' : values.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-4'} gap-6 max-w-5xl mx-auto`}>
            {values.map((value, index) => (
              <div 
                key={value.id}
                className="group glow-card p-6 text-center animate-fade-in"
                style={{ animationDelay: `${0.1 + index * 0.1}s` }}
              >
                {/* Icon */}
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-primary/10 to-accent/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <div className="text-primary">
                    {iconMap[value.icon] || <Heart className="h-6 w-6" />}
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                  {value.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        ) : layout === 'list' ? (
          // List layout - vertical with larger text
          <div className="max-w-2xl mx-auto space-y-6">
            {values.map((value, index) => (
              <div 
                key={value.id}
                className="flex items-start gap-4 animate-fade-in"
                style={{ animationDelay: `${0.1 + index * 0.1}s` }}
              >
                <div className="w-10 h-10 shrink-0 rounded-lg bg-gradient-to-br from-primary/10 to-accent/5 flex items-center justify-center">
                  <div className="text-primary">
                    {iconMap[value.icon] || <Heart className="h-5 w-5" />}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Cards layout - larger, more prominent
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {values.map((value, index) => (
              <div 
                key={value.id}
                className="group relative p-8 rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors animate-fade-in"
                style={{ animationDelay: `${0.1 + index * 0.1}s` }}
              >
                {/* Large icon */}
                <div className="w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/5 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                  <div className="text-primary">
                    {iconMap[value.icon] || <Heart className="h-8 w-8" />}
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                  {value.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {value.description}
                </p>
                
                {/* Decorative */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ValuesBlock;
