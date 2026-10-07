// ============================================
// About Split Block - 2026 Design System
// Clean personal story focus with social links
// Skills moved to dedicated SkillsBarBlock
// ============================================

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Linkedin, Github, Twitter, Globe, Mail, Instagram, Youtube } from 'lucide-react';
import type { AboutSplitBlockConfig } from '@/types/blockConfigs';

interface AboutSplitBlockProps {
  config: Record<string, unknown>;
}

const socialIconMap: Record<string, React.ReactNode> = {
  linkedin: <Linkedin className="h-5 w-5" />,
  github: <Github className="h-5 w-5" />,
  twitter: <Twitter className="h-5 w-5" />,
  website: <Globe className="h-5 w-5" />,
  email: <Mail className="h-5 w-5" />,
  instagram: <Instagram className="h-5 w-5" />,
  youtube: <Youtube className="h-5 w-5" />,
};

const AboutSplitBlock: React.FC<AboutSplitBlockProps> = ({ config }) => {
  const typedConfig = config as AboutSplitBlockConfig;
  
  const name = typedConfig.name;
  const introText = typedConfig.intro_text || 'Introduction text...';
  const additionalText = typedConfig.additional_text || 'Additional text...';
  const imageUrl = typedConfig.image_url;
  const socialLinks = typedConfig.social_links?.filter(link => link.enabled && link.url) || [];

  const isLoading = !typedConfig.name;

  return (
    <section id="about" className="section-container-sm relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/30 to-transparent" />
      
      <div className="container mx-auto px-4 relative">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-sm font-medium text-primary uppercase tracking-widest mb-4 animate-fade-in">
            About
          </span>
          <h2 className="section-title-gradient animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Who I Am
          </h2>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Skeleton className="h-6 w-full rounded-lg" />
              <Skeleton className="h-6 w-5/6 rounded-lg" />
              <Skeleton className="h-6 w-4/5 rounded-lg" />
            </div>
            <Skeleton className="h-48 w-48 rounded-2xl" />
          </div>
        ) : (
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 items-center animate-fade-in"
            style={{ animationDelay: '0.2s' }}
          >
            {/* Large Portrait with Glow */}
            {imageUrl && (
              <div className="relative group max-w-md w-full mx-auto md:mx-0">
                <div className="absolute -inset-4 bg-primary rounded-3xl blur-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-500" />
                <div className="relative aspect-square rounded-3xl overflow-hidden border border-border/60 bg-card">
                  <img
                    src={imageUrl}
                    alt={name || "Profile"}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* Text Content */}
            <div className="space-y-5">
              <p className="text-lg lg:text-xl text-foreground/90 leading-relaxed">
                {introText}
              </p>
              {additionalText && additionalText !== 'Additional text...' && (
                <p className="text-base text-muted-foreground leading-relaxed">
                  {additionalText}
                </p>
              )}

              {/* Social Links */}
              {socialLinks.length > 0 && (
                <div className="flex gap-2 pt-2">
                  {socialLinks.map((link) => (
                    <a
                      key={link.platform}
                      href={link.platform === 'email' ? `mailto:${link.url}` : link.url}
                      target={link.platform === 'email' ? undefined : '_blank'}
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-muted/50 hover:bg-primary/10 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                      aria-label={link.platform}
                    >
                      {socialIconMap[link.platform]}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default AboutSplitBlock;