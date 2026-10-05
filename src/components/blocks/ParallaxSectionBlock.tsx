// ============================================
// Parallax Section Block
// Clean parallax with IntersectionObserver
// ============================================

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { MarkdownContent } from '@/components/common';

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
    const last = lines[lines.length - 1];
    if (last.endsWith(':')) {
      lines.slice(0, -1).forEach((l, k) => nodes.push(<p key={`${i}-${k}`}>{l}</p>));
      let items = paragraphs.slice(i + 1);
      let closing: string | undefined;
      if (items.length > 2) { closing = items[items.length - 1]; items = items.slice(0, -1); }
      nodes.push(
        <div key={`list-${i}`}>
          <h3 className="font-semibold mb-3">{last}</h3>
          <ul className="list-disc pl-5 space-y-2 marker:text-primary">
            {items.map((it, k) => <li key={k}>{it}</li>)}
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

const ParallaxSectionBlock: React.FC<ParallaxSectionBlockProps> = ({ config }) => {
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
    <section
      ref={sectionRef}
      className={cn(
        'relative overflow-hidden',
        heightClasses[settings.height || 'md']
      )}
    >
      {/* Background with CSS parallax */}
      {settings.background_image && (
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-fixed"
          style={{
            backgroundImage: `url(${settings.background_image})`,
          }}
        />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-background/70" />

      {/* Content */}
      <div className="relative z-10 h-full flex items-center justify-center px-6">
        <div
          className={cn(
            'max-w-3xl text-center space-y-6',
            'opacity-0 translate-y-6 transition-all duration-700 ease-out',
            isVisible && 'opacity-100 translate-y-0'
          )}
        >
          {settings.title && (
            <h2
              className={cn(
                'text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight',
                isLight ? 'text-white' : 'text-foreground'
              )}
            >
              {settings.title}
            </h2>
          )}

          {settings.content && (
            <div
              className={cn(
                'max-w-2xl mx-auto text-left rounded-2xl border border-border/60 bg-background/90 backdrop-blur-md shadow-sm p-6 md:p-8',
                'text-base md:text-lg leading-relaxed text-foreground',
                'opacity-0 translate-y-4 transition-all duration-700 delay-200 ease-out',
                isVisible && 'opacity-100 translate-y-0'
              )}
            >
              <ParallaxContent content={settings.content} />
            </div>
          )}

          {/* Decorative line */}
          <div
            className={cn(
              'w-16 h-0.5 mx-auto rounded-full bg-primary',
              'opacity-0 scale-x-0 transition-all duration-700 delay-400 ease-out',
              isVisible && 'opacity-100 scale-x-100'
            )}
          />
        </div>
      </div>
    </section>
  );
};

export default ParallaxSectionBlock;
