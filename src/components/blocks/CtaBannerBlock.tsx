// ============================================
// CTA Banner Block - 2026 Design System
// Modern call-to-action with gradient effects
// ============================================

import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useIsStudio } from '@/hooks/useCurrentTheme';
import SmartLink from '@/components/studio/SmartLink';
import { StudioContainer } from '@/components/studio/StudioSection';

interface CtaBannerBlockConfig {
  title?: string;
  subtitle?: string;
  button_text?: string;
  button_url?: string;
  /** Optional second, outlined button (e.g. "Ask Magnet first" → /chat) */
  secondary_button_text?: string;
  secondary_button_url?: string;
  style?: 'default' | 'gradient' | 'dark';
}

interface CtaBannerBlockProps {
  config: Record<string, unknown>;
}

const CtaBannerClassic: React.FC<CtaBannerBlockProps> = ({ config }) => {
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

// Studio: a dark contact band (title + one line on the left, two pill buttons on the right)
const CtaBannerStudio: React.FC<CtaBannerBlockProps> = ({ config }) => {
  const {
    title = 'Ready to get started?',
    subtitle,
    button_text = 'Get Started',
    button_url = '/contact',
    secondary_button_text,
    secondary_button_url = '/chat',
  } = config as CtaBannerBlockConfig;
  const headingId = React.useId();
  const pill =
    'inline-flex h-12 items-center rounded-full px-[22px] text-[15px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60';

  return (
    <section aria-labelledby={headingId}>
      <StudioContainer className="pb-16 pt-4 md:pb-20">
        <div className="flex flex-wrap items-center justify-between gap-8 rounded-3xl border border-transparent bg-[hsl(240_15%_5%)] p-8 text-white dark:border-border dark:bg-card sm:p-12 md:gap-10 md:p-14">
          <div className="min-w-0 flex-[1_1_420px]">
            <h2 id={headingId} className="text-[28px] font-semibold leading-[1.1] tracking-[-0.02em] text-white sm:text-[36px]">
              {title}
            </h2>
            {subtitle && <p className="mt-3.5 text-[16px] leading-[1.55] text-[hsl(240_8%_80%)]">{subtitle}</p>}
          </div>
          <div className="flex flex-wrap gap-3">
            <SmartLink href={button_url || '/contact'} className={cn(pill, 'bg-white text-[hsl(240_15%_5%)] hover:bg-white/90')}>
              {button_text}
            </SmartLink>
            {secondary_button_text && (
              <SmartLink
                href={secondary_button_url || '/chat'}
                className={cn(pill, 'border border-[hsl(240_8%_25%)] text-white hover:border-[hsl(240_8%_40%)] hover:bg-white/5')}
              >
                {secondary_button_text}
              </SmartLink>
            )}
          </div>
        </div>
      </StudioContainer>
    </section>
  );
};

const CtaBannerBlock: React.FC<CtaBannerBlockProps> = (props) => {
  const isStudio = useIsStudio();
  return isStudio ? <CtaBannerStudio {...props} /> : <CtaBannerClassic {...props} />;
};

export default CtaBannerBlock;