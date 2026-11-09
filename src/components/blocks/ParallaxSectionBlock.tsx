// ============================================
// Parallax Section Block
// Clean parallax with IntersectionObserver
// ============================================

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { MarkdownContent } from '@/components/common';
import { optimizedImageUrl } from '@/lib/imageUrl';
import { useIsStudio } from '@/hooks/useCurrentTheme';
import { StudioSection, studioH2 } from '@/components/studio/StudioSection';

// bg-fixed covers the viewport: request a viewport-sized variant (bucketed
// to 480px steps so few distinct transforms are generated)
const viewportImageWidth = (): number => {
  if (typeof window === 'undefined') return 1920;
  const px = window.innerWidth * (window.devicePixelRatio || 1);
  return Math.min(2500, Math.ceil(px / 480) * 480);
};

// Plain-text content: a line ending with ":" starts a list of the following
// paragraphs; a final paragraph after the list is kept as a closing line.
// Markdown content (headings/lists) is rendered as-is.
const ParallaxContent: React.FC<{ content: string }> = ({ content }) => {
  if (/^\s*(#|[-*] |\d+\. )/m.test(content)) return <MarkdownContent content={content} />;

  const paragraphs = content.split(/\n\s*\n+/).map((p) => p.trim()).filter(Boolean);
  const nodes: React.ReactNode[] = [];
  let i = 0;
  while (i < paragraphs.length) {
    const lines = paragraphs[i].split('\n').map((l) => l.trim()).filter(Boolean);
    const h = lines.findIndex((l) => l.endsWith(':'));
    if (h >= 0) {
      const last = lines[h];
      lines.slice(0, h).forEach((l, k) => nodes.push(<p key={`${i}-${k}`}>{l}</p>));
      let items = [...lines.slice(h + 1), ...paragraphs.slice(i + 1)];
      let closing: string | undefined;
      if (items.length > 2) { closing = items[items.length - 1]; items = items.slice(0, -1); }
      nodes.push(
        <div key={`list-${i}`}>
          <h3 className="font-semibold mb-3">{last}</h3>
          <ul className="space-y-2">
            {items.map((it, k) => (
              <li key={k} className="flex gap-3">
                <span aria-hidden className="mt-[0.7em] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span>{it}</span>
              </li>
            ))}
          </ul>
        </div>
      );
      if (closing) nodes.push(<p key="closing" className="font-medium">{closing}</p>);
      break;
    }
    if (lines.length > 1 && !/[.!?]$/.test(lines[0])) {
      nodes.push(
        <div key={i}>
          <h3 className="font-semibold mb-2">{lines[0]}</h3>
          <p>{lines.slice(1).join(' ')}</p>
        </div>
      );
    } else {
      nodes.push(<p key={i}>{lines.join(' ')}</p>);
    }
    i++;
  }
  return <div className="space-y-5">{nodes}</div>;
};

interface ParallaxSectionBlockConfig {
  background_image?: string;
  title?: string;
  content?: string;
  height?: 'sm' | 'md' | 'lg';
  text_color?: 'light' | 'dark';
}

interface ParallaxSectionBlockProps {
  config: Record<string, unknown>;
}

const ParallaxSectionClassic: React.FC<ParallaxSectionBlockProps> = ({ config }) => {
  const settings = config as ParallaxSectionBlockConfig;
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // IntersectionObserver for visibility detection
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const heightClasses: Record<string, string> = {
    sm: 'min-h-[40vh]',
    md: 'min-h-[60vh]',
    lg: 'min-h-[80vh]',
  };

  const isLight = settings.text_color !== 'dark';

  return (
    <section ref={sectionRef} className="py-12 md:py-20 px-4 md:px-6">
      <div
        className={cn(
          'max-w-6xl mx-auto relative rounded-[2rem] md:rounded-[3rem] overflow-hidden border border-border/50 bg-secondary flex items-end p-6 md:p-14',
          heightClasses[settings.height || 'md']
        )}
      >
        {/* Background with CSS parallax */}
        {settings.background_image && (
          <div
            className="absolute inset-0 w-full h-full bg-cover bg-center bg-fixed"
            style={{
              backgroundImage: `url("${optimizedImageUrl(settings.background_image, viewportImageWidth(), 70)}")`,
            }}
          />
        )}

        {/* Overlay — deep gradient anchoring text at the bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />

        {/* Content */}
        <div
          className={cn(
            'relative z-10 max-w-2xl space-y-6',
            'opacity-0 translate-y-6 transition-all duration-700 ease-out',
            isVisible && 'opacity-100 translate-y-0'
          )}
        >
          {settings.title && (
            <h2
              className={cn(
                'text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight font-heading',
                isLight ? 'text-white' : 'text-foreground'
              )}
            >
              {settings.title}
            </h2>
          )}

          {settings.content && (
            <div
              className={cn(
                'text-left rounded-2xl border border-foreground/10 bg-foreground/5 backdrop-blur-xl p-6 md:p-8',
                'text-base md:text-lg leading-relaxed',
                isLight ? 'text-white/90' : 'text-foreground',
                'opacity-0 translate-y-4 transition-all duration-700 delay-200 ease-out',
                isVisible && 'opacity-100 translate-y-0'
              )}
            >
              <ParallaxContent content={settings.content} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

// Studio: no parallax or overlay; title (and a still image) beside the text
const ParallaxSectionStudio: React.FC<ParallaxSectionBlockProps> = ({ config }) => {
  const settings = config as ParallaxSectionBlockConfig;
  const headingId = React.useId();
  return (
    <StudioSection labelledBy={settings.title ? headingId : undefined}>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:gap-14">
        <div className="min-w-0 space-y-6">
          {settings.title && (
            <h2 id={headingId} className={studioH2}>
              {settings.title}
            </h2>
          )}
          {settings.background_image && (
            <div className="aspect-[4/3] overflow-hidden rounded-[14px] border border-border bg-muted">
              <img
                src={optimizedImageUrl(settings.background_image, 960, 70)}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
          )}
        </div>
        {settings.content && (
          <div className="min-w-0 max-w-[62ch] text-[16px] leading-[1.65] text-foreground/80 [&_h3]:text-[17px] [&_h3]:text-foreground">
            <ParallaxContent content={settings.content} />
          </div>
        )}
      </div>
    </StudioSection>
  );
};

const ParallaxSectionBlock: React.FC<ParallaxSectionBlockProps> = (props) => {
  const isStudio = useIsStudio();
  return isStudio ? <ParallaxSectionStudio {...props} /> : <ParallaxSectionClassic {...props} />;
};

export default ParallaxSectionBlock;
