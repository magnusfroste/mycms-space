// ============================================
// CTA Banner Block
// Call-to-action section with button
// ============================================

import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

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
    style = 'default',
  } = typedConfig;

  const styleClasses = {
    default: 'bg-card border border-border',
    gradient: 'bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10',
    dark: 'bg-foreground text-background',
  };

  const isExternal = button_url?.startsWith('http');

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div
          className={cn(
            'rounded-2xl p-8 md:p-12 text-center',
            styleClasses[style]
          )}
        >
          <h2
            className={cn(
              'text-3xl md:text-4xl font-bold mb-4',
              style === 'dark' ? 'text-background' : 'text-foreground'
            )}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              className={cn(
                'text-lg mb-8 max-w-2xl mx-auto',
                style === 'dark' ? 'text-background/80' : 'text-muted-foreground'
              )}
            >
              {subtitle}
            </p>
          )}
          {isExternal ? (
            <a href={button_url} target="_blank" rel="noopener noreferrer">
              <Button
                size="lg"
                variant={style === 'dark' ? 'secondary' : 'default'}
                className="group"
              >
                {button_text}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </a>
          ) : (
            <Link to={button_url || '/chat'}>
              <Button
                size="lg"
                variant={style === 'dark' ? 'secondary' : 'default'}
                className="group"
              >
                {button_text}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
};

export default CtaBannerBlock;
