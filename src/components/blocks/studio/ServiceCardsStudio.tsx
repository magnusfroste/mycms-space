// ============================================
// Service cards - Studio
// Numbered hairline cards ("How I can help"), shared by the
// expertise-grid and about-split blocks under the studio theme.
// ============================================

import React, { useId } from 'react';
import { StudioSection, StudioSectionHeader } from '@/components/studio/StudioSection';
import SmartLink from '@/components/studio/SmartLink';

export interface StudioServiceItem {
  id?: string;
  title: string;
  description: string;
  cta_text?: string;
  cta_link?: string;
}

interface ServiceCardsStudioProps {
  id?: string;
  title?: string;
  subtitle?: string;
  items: StudioServiceItem[];
  columns?: 2 | 3;
  tone?: 'default' | 'muted';
  /** Extra content above the cards (e.g. an intro paragraph) */
  lead?: React.ReactNode;
}

const ServiceCardsStudio: React.FC<ServiceCardsStudioProps> = ({
  id,
  title,
  subtitle,
  items,
  columns = 3,
  tone = 'muted',
  lead,
}) => {
  const headingId = useId();
  return (
    <StudioSection id={id} tone={tone} labelledBy={title ? headingId : undefined}>
      <div className="flex flex-col gap-8">
        <StudioSectionHeader id={headingId} title={title} subtitle={subtitle} layout="split" />
        {lead}
        {items.length > 0 && (
          <div
            className={
              columns === 2
                ? 'grid grid-cols-1 gap-4 md:grid-cols-2'
                : 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
            }
          >
            {items.map((item, index) => (
              <article
                key={item.id || item.title}
                className="flex flex-col gap-2.5 rounded-[14px] border border-border bg-card p-6"
              >
                <span className="font-mono text-xs text-accent">{String(index + 1).padStart(2, '0')}</span>
                <h3 className="text-[18px] font-semibold leading-snug tracking-[-0.01em] text-foreground">
                  {item.title}
                </h3>
                <p className="text-[14.5px] leading-[1.55] text-foreground/75">{item.description}</p>
                {item.cta_text && item.cta_link && (
                  <SmartLink href={item.cta_link} className="studio-link mt-auto pt-2 text-sm font-medium">
                    {item.cta_text} <span aria-hidden="true">→</span>
                  </SmartLink>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </StudioSection>
  );
};

export default ServiceCardsStudio;
