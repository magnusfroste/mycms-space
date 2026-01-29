// ============================================
// Bento Grid Block
// Modern asymmetric grid layout (Apple/Linear style)
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
    gradient: 'from-purple-500/20 to-pink-500/20',
  },
  {
    id: '2',
    title: 'Lightning Fast',
    description: 'Optimized for speed and performance.',
    icon: 'zap',
    size: 'small',
    gradient: 'from-yellow-500/20 to-orange-500/20',
  },
  {
    id: '3',
    title: 'Secure by Default',
    description: 'Enterprise-grade security built in.',
    icon: 'shield',
    size: 'small',
    gradient: 'from-green-500/20 to-emerald-500/20',
  },
  {
    id: '4',
    title: 'Beautiful Aesthetics',
    description: 'Pixel-perfect designs that captivate and inspire your audience.',
    icon: 'palette',
    size: 'medium',
    gradient: 'from-blue-500/20 to-cyan-500/20',
  },
  {
    id: '5',
    title: 'Developer Experience',
    description: 'Built for developers with clean APIs and comprehensive docs.',
    icon: 'code',
    size: 'medium',
    gradient: 'from-indigo-500/20 to-violet-500/20',
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
    <section className="py-24 px-6 md:px-12 lg:px-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            {settings.headline || 'Everything You Need'}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {settings.subheadline || 'A complete toolkit designed for modern creators and developers.'}
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
          {items.map((item, index) => (
            <div
              key={item.id}
              className={cn(
                'group relative overflow-hidden rounded-3xl border border-border/50',
                'bg-gradient-to-br from-card to-card/50',
                'p-6 md:p-8 transition-all duration-500',
                'hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5',
                'hover:-translate-y-1',
                getSizeClasses(item.size)
              )}
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              {/* Background Gradient */}
              <div 
                className={cn(
                  'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500',
                  `bg-gradient-to-br ${item.gradient || 'from-primary/10 to-primary/5'}`
                )}
              />

              {/* Glow Effect */}
              <div className="absolute -inset-px bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />

              {/* Content */}
              <div className="relative z-10 h-full flex flex-col">
                {/* Icon */}
                <div className="mb-4 p-3 w-fit rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-300">
                  {iconMap[item.icon || 'sparkles'] || <Sparkles className="w-6 h-6" />}
                </div>

                {/* Image (if provided) */}
                {item.image_url && (
                  <div className="mb-4 rounded-xl overflow-hidden">
                    <img 
                      src={item.image_url} 
                      alt={item.title}
                      className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}

                {/* Text */}
                <h3 className="text-xl md:text-2xl font-semibold mb-2 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-muted-foreground flex-grow">
                  {item.description}
                </p>

                {/* Decorative Arrow (large cards) */}
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
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BentoGridBlock;
