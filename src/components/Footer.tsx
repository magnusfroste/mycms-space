// ============================================
// Footer - 2026 Design System
// Subtle elegance with gradient accents
// ============================================

import React from 'react';
import { Github, Linkedin, Twitter, Instagram, Youtube, Link as LinkIcon } from 'lucide-react';
import { useFooterModule } from '@/models/modules';
import { cn } from '@/lib/utils';
import type { SocialLink } from '@/types/modules';

const SOCIAL_ICONS: Record<SocialLink['platform'], React.ElementType> = {
  github: Github,
  linkedin: Linkedin,
  twitter: Twitter,
  instagram: Instagram,
  youtube: Youtube,
  custom: LinkIcon,
};

const Footer = () => {
  const { config: footerConfig, isLoading } = useFooterModule();

  const getCopyrightText = () => {
    const text = footerConfig?.copyright_text || '© {year} Magnus Froste. All rights reserved.';
    return text.replace('{year}', new Date().getFullYear().toString());
  };

  const socialLinks = footerConfig?.social_links || [];
  const showSocialLinks = footerConfig?.show_social_links !== false;

  return (
    <footer className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-t from-muted/50 to-transparent" />
      
      {/* Top Border Gradient */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      <div className="relative container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Copyright */}
          <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <p className="text-sm text-muted-foreground">
              {getCopyrightText()}
            </p>
          </div>
          
          {/* Social Links */}
          {showSocialLinks && socialLinks.length > 0 && (
            <div 
              className="flex items-center gap-2 animate-fade-in"
              style={{ animationDelay: '0.2s' }}
            >
              {socialLinks.map((link, index) => {
                const IconComponent = SOCIAL_ICONS[link.platform] || LinkIcon;
                return (
                  <a 
                    key={`${link.platform}-${index}`}
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={cn(
                      "group relative p-3 rounded-xl",
                      "text-muted-foreground hover:text-foreground",
                      "transition-all duration-300",
                      "hover:bg-muted"
                    )}
                    aria-label={link.label || link.platform}
                  >
                    {/* Glow effect */}
                    <div className="absolute inset-0 rounded-xl bg-primary/10 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />
                    
                    <IconComponent className="relative h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom decorative element */}
        <div className="mt-8 flex justify-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center gap-3 text-muted-foreground/40">
            <div className="w-8 h-px bg-gradient-to-r from-transparent to-border" />
            <span className="text-xs uppercase tracking-widest">Built with care</span>
            <div className="w-8 h-px bg-gradient-to-l from-transparent to-border" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
