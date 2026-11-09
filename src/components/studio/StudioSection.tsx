// ============================================
// Studio layout primitives
// Shared container, section and section header for the quiet
// "studio" theme (max-width 1120px, hairline borders, calm rhythm).
// ============================================

import React from 'react';
import { cn } from '@/lib/utils';
import SmartLink from './SmartLink';

export const StudioContainer: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className,
  children,
}) => <div className={cn('mx-auto w-full max-w-[1120px] px-4 sm:px-6', className)}>{children}</div>;

interface StudioSectionProps {
  id?: string;
  /** 'muted' gives the section a faint band background */
  tone?: 'default' | 'muted';
  /** Hairline border on top (default true) */
  bordered?: boolean;
  labelledBy?: string;
  className?: string;
  containerClassName?: string;
  children: React.ReactNode;
}

export const StudioSection: React.FC<StudioSectionProps> = ({
  id,
  tone = 'default',
  bordered = true,
  labelledBy,
  className,
  containerClassName,
  children,
}) => (
  <section
    id={id}
    aria-labelledby={labelledBy}
    className={cn(bordered && 'border-t border-border/70', tone === 'muted' && 'bg-muted/50', className)}
  >
    <StudioContainer className={cn('py-16 md:py-20', containerClassName)}>{children}</StudioContainer>
  </section>
);

interface StudioSectionHeaderProps {
  title?: string;
  subtitle?: string;
  /** 'split': subtitle on the right of the title; 'stacked': subtitle below the title */
  layout?: 'split' | 'stacked';
  action?: { label: string; href: string };
  as?: 'h1' | 'h2';
  id?: string;
  className?: string;
}

export const studioH1 = 'text-[36px] sm:text-[48px] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground';
export const studioH2 = 'text-[26px] sm:text-[32px] font-semibold leading-[1.15] tracking-[-0.02em] text-foreground';

export const StudioSectionHeader: React.FC<StudioSectionHeaderProps> = ({
  title,
  subtitle,
  layout = 'stacked',
  action,
  as: Heading = 'h2',
  id,
  className,
}) => {
  if (!title && !subtitle && !action) return null;
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-x-6 gap-y-3', className)}>
      <div className="min-w-0">
        {title && (
          <Heading id={id} className={Heading === 'h1' ? studioH1 : studioH2}>
            {title}
          </Heading>
        )}
        {subtitle && layout === 'stacked' && (
          <p
            className={cn(
              'max-w-[560px] leading-[1.55] text-muted-foreground',
              Heading === 'h1' ? 'mt-3 text-[17px]' : 'mt-2 text-[15px]'
            )}
          >
            {subtitle}
          </p>
        )}
      </div>
      {subtitle && layout === 'split' && (
        <p className="max-w-[420px] text-[15px] leading-[1.55] text-muted-foreground">{subtitle}</p>
      )}
      {action && (
        <SmartLink href={action.href} className="studio-link text-sm font-medium">
          {action.label} <span aria-hidden="true">→</span>
        </SmartLink>
      )}
    </div>
  );
};
