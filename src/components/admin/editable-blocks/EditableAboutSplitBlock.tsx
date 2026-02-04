// ============================================
// Editable About Split Block
// Inline editing for about me section
// Clean person-story focus with social links
// ============================================

import React from 'react';
import { Linkedin, Github, Twitter, Globe, Mail, Instagram, Youtube } from 'lucide-react';
import type { AboutSplitBlockConfig } from '@/types/blockConfigs';
import EditableText from './EditableText';
import { AITextActions } from '@/components/common';

interface EditableAboutSplitBlockProps {
  config: Record<string, unknown>;
  pendingChanges?: Record<string, unknown>;
  isEditMode: boolean;
  onChange: (changes: Record<string, unknown>) => void;
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

const EditableAboutSplitBlock: React.FC<EditableAboutSplitBlockProps> = ({
  config,
  pendingChanges = {},
  isEditMode,
  onChange,
}) => {
  const typedConfig = config as AboutSplitBlockConfig;
  
  // Merge config with pending changes
  const getValue = <K extends keyof AboutSplitBlockConfig>(key: K, fallback: AboutSplitBlockConfig[K]): AboutSplitBlockConfig[K] => {
    if (key in pendingChanges) {
      return pendingChanges[key] as AboutSplitBlockConfig[K];
    }
    return typedConfig[key] ?? fallback;
  };

  const name = getValue('name', '');
  const introText = getValue('intro_text', 'Introduction text...');
  const additionalText = getValue('additional_text', '');
  const imageUrl = getValue('image_url', '');
  const socialLinks = (getValue('social_links', []) || []).filter(link => link.enabled && link.url);

  return (
    <section id="about" className="section-container relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/30 to-transparent" />
      
      <div className="container mx-auto px-4 relative">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-sm font-medium text-primary uppercase tracking-widest mb-4">
            About
          </span>
          <h2 className="section-title-gradient">
            Who I Am
          </h2>
        </div>
        
        <div className="space-y-8">
          {/* Top Row - Image + Intro Text Side by Side */}
          <div className="flex flex-col sm:flex-row gap-6 lg:gap-10 items-start">
            {/* Profile Image with Social Links */}
            {imageUrl && (
              <div className="relative group shrink-0">
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 rounded-2xl overflow-hidden">
                  <div className="absolute -inset-px bg-gradient-primary rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative bg-card rounded-2xl overflow-hidden p-0.5 h-full">
                    <img 
                      src={imageUrl} 
                      alt={name || "Profile"} 
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </div>
                </div>
                {/* Subtle Glow */}
                <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-xl -z-10" />
                
                {/* Social Links under image */}
                {socialLinks.length > 0 && (
                  <div className="flex justify-center gap-2 mt-4">
                    {socialLinks.map((link) => (
                      <a
                        key={link.platform}
                        href={link.platform === 'email' ? `mailto:${link.url}` : link.url}
                        target={link.platform === 'email' ? undefined : '_blank'}
                        rel="noopener noreferrer"
                        className="w-9 h-9 rounded-full bg-muted/50 hover:bg-primary/10 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                        aria-label={link.platform}
                      >
                        {socialIconMap[link.platform]}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Text Content */}
            <div className="flex-1 space-y-4">
              {/* Intro Text */}
              <div className="space-y-1">
                {isEditMode && (
                  <div className="flex justify-end">
                    <AITextActions
                      text={introText as string}
                      onTextChange={(value) => onChange({ intro_text: value })}
                      context="intro text for About Me section"
                      mode="text"
                    />
                  </div>
                )}
                <div className="text-lg lg:text-xl text-foreground/90 leading-relaxed">
                  <EditableText
                    value={introText as string}
                    isEditMode={isEditMode}
                    onChange={(value) => onChange({ intro_text: value })}
                    placeholder="Share your story here..."
                    multiline
                  />
                </div>
              </div>
              
              {/* Additional Text */}
              <div className="space-y-1">
                {isEditMode && (
                  <div className="flex justify-end">
                    <AITextActions
                      text={additionalText as string}
                      onTextChange={(value) => onChange({ additional_text: value })}
                      context="additional text for About Me section"
                      mode="text"
                    />
                  </div>
                )}
                <div className="text-base text-muted-foreground leading-relaxed">
                  <EditableText
                    value={additionalText as string}
                    isEditMode={isEditMode}
                    onChange={(value) => onChange({ additional_text: value })}
                    placeholder="Add more details about your background..."
                    multiline
                  />
                </div>
              </div>
              
              {/* Social Links inline (if no image) */}
              {!imageUrl && socialLinks.length > 0 && (
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
          
          {/* Social Links Empty State for Edit Mode */}
          {socialLinks.length === 0 && isEditMode && (
            <div className="flex flex-wrap gap-3 pt-4 opacity-50">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-dashed border-muted-foreground/30">
                <span className="text-sm text-muted-foreground">
                  Add social links in the block settings panel →
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default EditableAboutSplitBlock;
