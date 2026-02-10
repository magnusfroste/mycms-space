// ============================================
// Stats Counter Block
// Animated statistics with counting animation
// ============================================

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface StatItem {
  id: string;
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  description?: string;
}

interface StatsCounterBlockConfig {
  headline?: string;
  subheadline?: string;
  stats?: StatItem[];
  layout?: 'grid' | 'inline';
  animate?: boolean;
}

interface StatsCounterBlockProps {
  config: Record<string, unknown>;
}

const defaultStats: StatItem[] = [
  { id: '1', value: 150, suffix: '+', label: 'Projects Completed', description: 'Successful deliveries' },
  { id: '2', value: 98, suffix: '%', label: 'Client Satisfaction', description: 'Happy customers' },
  { id: '3', value: 12, suffix: 'M', prefix: '$', label: 'Revenue Generated', description: 'For our clients' },
  { id: '4', value: 24, suffix: '/7', label: 'Support Available', description: 'Always here for you' },
];

const AnimatedNumber: React.FC<{ 
  value: number; 
  prefix?: string; 
  suffix?: string; 
  isVisible: boolean;
  duration?: number;
}> = ({ value, prefix = '', suffix = '', isVisible, duration = 2000 }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(Math.floor(easeOutQuart * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [value, isVisible, duration]);

  return (
    <span className="tabular-nums">
      {prefix}{displayValue}{suffix}
    </span>
  );
};

const StatsCounterBlock: React.FC<StatsCounterBlockProps> = ({ config }) => {
  const settings = config as StatsCounterBlockConfig;
  const stats = settings.stats || defaultStats;
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="section-container relative overflow-hidden"
    >
      {/* Background Decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-sm font-medium text-primary uppercase tracking-widest mb-4 animate-fade-in">
            Stats
          </span>
          {settings.headline && (
            <h2 className="section-title animate-fade-in" style={{ animationDelay: '0.1s' }}>
              {settings.headline}
            </h2>
          )}
          {settings.subheadline && (
            <p className="section-subtitle mt-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              {settings.subheadline}
            </p>
          )}
        </div>

        {/* Stats Grid */}
        <div className={cn(
          'grid gap-8',
          settings.layout === 'inline' 
            ? 'grid-cols-2 md:grid-cols-4' 
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
        )}>
          {stats.map((stat, index) => (
            <div
              key={stat.id}
              className={cn(
                'group relative p-8 rounded-3xl',
                'bg-gradient-to-br from-card/80 to-card/40',
                'border border-border/50 hover:border-primary/30',
                'transition-all duration-500',
                'opacity-0 translate-y-8',
                isVisible && 'opacity-100 translate-y-0'
              )}
              style={{
                transitionDelay: `${index * 100}ms`,
              }}
            >
              {/* Glow on hover */}
              <div className="absolute inset-0 rounded-3xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10 text-center">
                {/* Number */}
                <div className="text-5xl md:text-6xl lg:text-7xl font-bold mb-2 bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
                  {settings.animate !== false ? (
                    <AnimatedNumber
                      value={stat.value}
                      prefix={stat.prefix}
                      suffix={stat.suffix}
                      isVisible={isVisible}
                      duration={2000 + index * 200}
                    />
                  ) : (
                    `${stat.prefix || ''}${stat.value}${stat.suffix || ''}`
                  )}
                </div>

                {/* Label */}
                <div className="text-lg font-semibold text-foreground mb-1">
                  {stat.label}
                </div>

                {/* Description */}
                {stat.description && (
                  <div className="text-sm text-muted-foreground">
                    {stat.description}
                  </div>
                )}
              </div>

              {/* Decorative line */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent group-hover:w-1/2 transition-all duration-500" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsCounterBlock;
