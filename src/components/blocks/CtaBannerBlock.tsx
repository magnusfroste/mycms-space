// ============================================
// CTA Banner Block - 2026 Design System
// Modern call-to-action with gradient effects
// ============================================

import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

interface CtaBannerBlockConfig {
  title?: string;
  subtitle?: string;
  button_text?: string;
  button_url?: string;
  style?: 'default' | 'gradient' | 'dark';
}

interface CtaBannerBlockProps {
  config: Record<string, unknown>;
}

const CtaBannerBlock: React.FC<CtaBannerBlockProps> = ({ config }) => {
  const typedConfig = config as CtaBannerBlockConfig;
  const {
    title = 'Ready to get started?',
    subtitle,
    button_text = 'Get Started',
    button_url = '/chat',
    style = 'gradient',
  } = typedConfig;

  const isExternal = button_url?.startsWith('http');

  const ButtonComponent = (
    <Button
      size="lg"
      className={cn(
        "group relative overflow-hidden px-8 py-6 text-base font-medium rounded-full transition-all duration-300",
        style === 'dark' 
          ? "bg-background text-foreground hover:bg-background/90" 
          : "bg-foreground text-background hover:bg-foreground/90 dark:bg-primary-foreground dark:text-primary dark:hover:bg-primary-foreground/90"
      )}
    >
      <span className="relative z-10 flex items-center gap-2">
        {button_text}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </span>
    </Button>
  );

  return (
    <section className="section-container-sm">
      <div className="container mx-auto px-4">
        <div
          className={cn(
            'relative overflow-hidden rounded-3xl p-10 md:p-16 text-center',
            style === 'dark' && 'bg-foreground',
            style === 'gradient' && 'bg-gradient-to-br from-primary via-gradient-mid to-accent',
            style === 'default' && 'bg-card border border-border'
          )}
        >
          {/* Background Pattern */}
          {style !== 'default' && (
            <>
              <div 
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
                  backgroundSize: '32px 32px',
                }}
              />
              {/* Gradient Orbs */}
              <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
            </>
          )}

          {/* Content */}
          <div className="relative z-10 max-w-2xl mx-auto">
            {/* Badge */}
            <div 
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-medium",
                style === 'default' 
                  ? "bg-primary/10 text-primary" 
                  : "bg-white/20 text-white"
              )}
            >
              <Sparkles className="w-4 h-4" />
              <span>Let's Connect</span>
            </div>

            {/* Title */}
            <h2
              className={cn(
                'text-3xl md:text-4xl lg:text-5xl font-bold mb-4 tracking-tight',
                style === 'default' ? 'text-foreground' : 'text-white'
              )}
            >
              {title}
            </h2>
            
            {/* Subtitle */}
            {subtitle && (
              <p
                className={cn(
                  'text-lg md:text-xl mb-10 max-w-xl mx-auto',
                  style === 'default' ? 'text-muted-foreground' : 'text-white/80'
                )}
              >
                {subtitle}
              </p>
            )}
            
            {/* Button */}
            {isExternal ? (
              <a href={button_url} target="_blank" rel="noopener noreferrer">
                {ButtonComponent}
              </a>
            ) : (
              <Link to={button_url || '/chat'}>
                {ButtonComponent}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaBannerBlock;