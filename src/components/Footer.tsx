import React from 'react';
import { Github, Linkedin, Twitter, Instagram, Youtube, Link as LinkIcon } from 'lucide-react';
import { useFooterModule } from '@/models/modules';
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

  // Parse copyright text (replace {year} with current year)
  const getCopyrightText = () => {
    const text = footerConfig?.copyright_text || '© {year} Magnus Froste. All rights reserved.';
    return text.replace('{year}', new Date().getFullYear().toString());
  };

  const socialLinks = footerConfig?.social_links || [];
  const showSocialLinks = footerConfig?.show_social_links !== false;

  return (
    <footer className="bg-muted/30 py-10 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <p className="text-muted-foreground">{getCopyrightText()}</p>
          </div>
          
          {showSocialLinks && socialLinks.length > 0 && (
            <div className="flex space-x-6">
              {socialLinks.map((link, index) => {
                const IconComponent = SOCIAL_ICONS[link.platform] || LinkIcon;
                return (
                  <a 
                    key={`${link.platform}-${index}`}
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                    aria-label={link.label || link.platform}
                  >
                    <IconComponent className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
