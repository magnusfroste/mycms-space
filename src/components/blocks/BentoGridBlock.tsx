// ============================================
// Bento Grid Block - 2026 Design System
// Modern asymmetric grid with glass effects
// ============================================

import React from 'react';
import { cn } from '@/lib/utils';
import { 
  Sparkles, 
  Zap, 
  Shield, 
  Palette,
  Code,
  Rocket
} from 'lucide-react';

interface BentoItem {
  id: string;
  title: string;
  description: string;
  icon?: string;
  image_url?: string;
  size: 'small' | 'medium' | 'large';
  gradient?: string;
}

interface BentoGridBlockConfig {
  headline?: string;
  subheadline?: string;
  items?: BentoItem[];
}

interface BentoGridBlockProps {
  config: Record<string, unknown>;
}

const iconMap: Record<string, React.ReactNode> = {
  sparkles: <Sparkles className="w-6 h-6" />,
  zap: <Zap className="w-6 h-6" />,
  shield: <Shield className="w-6 h-6" />,
  palette: <Palette className="w-6 h-6" />,
  code: <Code className="w-6 h-6" />,
  rocket: <Rocket className="w-6 h-6" />,
};

const defaultItems: BentoItem[] = [
  {
    id: '1',
    title: 'AI-Powered Design',
    description: 'Let artificial intelligence enhance your creative workflow with smart suggestions and automation.',
    icon: 'sparkles',
    size: 'large',
  },
  {
    id: '2',
    title: 'Lightning Fast',
    description: 'Optimized for speed and performance.',
    icon: 'zap',
    size: 'small',
  },
  {
    id: '3',
    title: 'Secure by Default',
    description: 'Enterprise-grade security built in.',
    icon: 'shield',
    size: 'small',
  },
  {
    id: '4',
    title: 'Beautiful Aesthetics',
    description: 'Pixel-perfect designs that captivate and inspire your audience.',
    icon: 'palette',
    size: 'medium',
  },
  {
    id: '5',
    title: 'Developer Experience',
    description: 'Built for developers with clean APIs and comprehensive docs.',
    icon: 'code',
    size: 'medium',
  },
];

const BentoGridBlock: React.FC<BentoGridBlockProps> = ({ config }) => {
  const settings = config as BentoGridBlockConfig;
  const items = settings.items || defaultItems;

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'large':
        return 'md:col-span-2 md:row-span-2';
      case 'medium':
        return 'md:col-span-2';
      default:
        return '';
    }
  };

  return (
    <section className="section-container relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-mesh-gradient opacity-40" />
      
      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-sm font-medium text-primary uppercase tracking-widest mb-4 animate-fade-in">
            Features
          </span>
          <h2 
            className="section-title-gradient animate-fade-in"
            style={{ animationDelay: '0.1s' }}
          >
            {settings.headline || 'Everything You Need'}
          </h2>
          <p 
            className="section-subtitle mt-4 animate-fade-in"
            style={{ animationDelay: '0.2s' }}
          >
            {settings.subheadline || 'A complete toolkit designed for modern creators and developers.'}
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {items.map((item, index) => (
            <article
              key={item.id}
              className={cn(
                'group relative overflow-hidden rounded-3xl',
                'glow-card p-7 md:p-8',
                'animate-fade-in',
                getSizeClasses(item.size)
              )}
              style={{ animationDelay: `${0.1 + index * 0.05}s` }}
            >
              {/* Background Gradient on Hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Content */}
              <div className="relative z-10 h-full flex flex-col">
                {/* Icon */}
                <div className="relative mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <div className="text-primary">
                      {iconMap[item.icon || 'sparkles'] || <Sparkles className="w-6 h-6" />}
                    </div>
                  </div>
                  {/* Glow */}
                  <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                </div>

                {/* Image */}
                {item.image_url && (
                  <div className="mb-5 rounded-2xl overflow-hidden">
                    <img 
                      src={item.image_url} 
                      alt={item.title}
                      className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}

                {/* Text */}
                <h3 className="text-xl md:text-2xl font-semibold mb-3 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed flex-grow">
                  {item.description}
                </p>

                {/* Arrow for large cards */}
                {item.size === 'large' && (
                  <div className="mt-6 flex items-center gap-2 text-primary opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                    <span className="text-sm font-medium">Learn more</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Corner Decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BentoGridBlock;