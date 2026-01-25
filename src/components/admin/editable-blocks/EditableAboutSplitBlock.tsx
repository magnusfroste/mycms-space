// ============================================
// Editable About Split Block
// Inline editing for about me section
// ============================================

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { iconMap } from '@/lib/constants/iconMaps';
import type { AboutMeSettings } from '@/types';
import EditableText from './EditableText';

interface EditableAboutSplitBlockProps {
  config: Record<string, unknown>;
  aboutMeData?: AboutMeSettings | null;
  pendingChanges?: Record<string, unknown>;
  isEditMode: boolean;
  onChange: (changes: Record<string, unknown>) => void;
}

const EditableAboutSplitBlock: React.FC<EditableAboutSplitBlockProps> = ({
  config,
  aboutMeData,
  pendingChanges = {},
  isEditMode,
  onChange,
}) => {
  // Merge aboutMeData with pending changes
  const getValue = (key: keyof AboutMeSettings, fallback: string = '') => {
    return (pendingChanges[key] as string) ?? aboutMeData?.[key] ?? fallback;
  };

  return (
    <section id="about" className="py-20 bg-card" aria-labelledby="about-heading">
      <div className="container mx-auto px-4">
        <h2 id="about-heading" className="section-title">
          <EditableText
            value="About Me"
            isEditMode={false}
            onChange={() => {}}
            placeholder="About Me"
          />
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            {aboutMeData?.image_url && (
              <div className="mb-8">
                <Card className="overflow-hidden border-0 shadow-lg rounded-2xl bg-gradient-to-br from-primary/10 to-apple-blue/10 w-4/5 mx-auto">
                  <CardContent className="p-4">
                    <AspectRatio ratio={16/9} className="bg-muted rounded-xl overflow-hidden">
                      <img 
                        src={aboutMeData.image_url} 
                        alt={aboutMeData?.name || "Profile"} 
                        className="object-cover w-full h-full"
                      />
                    </AspectRatio>
                  </CardContent>
                </Card>
              </div>
            )}
            
            <p className="text-lg text-foreground/80 leading-relaxed">
              <EditableText
                value={getValue('intro_text', 'With over 20 years of experience in innovation strategy...')}
                isEditMode={isEditMode}
                onChange={(value) => onChange({ intro_text: value })}
                placeholder="Intro text"
                multiline
              />
            </p>
            
            <p className="text-lg text-foreground/80 leading-relaxed">
              <EditableText
                value={getValue('additional_text', 'My approach combines technical expertise...')}
                isEditMode={isEditMode}
                onChange={(value) => onChange({ additional_text: value })}
                placeholder="Additional text"
                multiline
              />
            </p>
          </div>
          
          <div className="space-y-6">
            {/* Skill 1 */}
            <article className="glass-card p-6 flex items-start gap-4">
              <div className="shrink-0 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                {iconMap[aboutMeData?.skill1_icon || 'Monitor']}
              </div>
              <div>
                <h3 className="font-semibold text-xl mb-2">
                  <EditableText
                    value={getValue('skill1_title', 'Technology Leadership')}
                    isEditMode={isEditMode}
                    onChange={(value) => onChange({ skill1_title: value })}
                    placeholder="Skill 1 title"
                  />
                </h3>
                <p className="text-muted-foreground">
                  <EditableText
                    value={getValue('skill1_description', 'Description...')}
                    isEditMode={isEditMode}
                    onChange={(value) => onChange({ skill1_description: value })}
                    placeholder="Skill 1 description"
                    multiline
                  />
                </p>
              </div>
            </article>
            
            {/* Skill 2 */}
            <article className="glass-card p-6 flex items-start gap-4">
              <div className="shrink-0 w-12 h-12 rounded-full bg-apple-blue/20 flex items-center justify-center">
                {iconMap[aboutMeData?.skill2_icon || 'Rocket']}
              </div>
              <div>
                <h3 className="font-semibold text-xl mb-2">
                  <EditableText
                    value={getValue('skill2_title', 'Product Strategy')}
                    isEditMode={isEditMode}
                    onChange={(value) => onChange({ skill2_title: value })}
                    placeholder="Skill 2 title"
                  />
                </h3>
                <p className="text-muted-foreground">
                  <EditableText
                    value={getValue('skill2_description', 'Description...')}
                    isEditMode={isEditMode}
                    onChange={(value) => onChange({ skill2_description: value })}
                    placeholder="Skill 2 description"
                    multiline
                  />
                </p>
              </div>
            </article>
            
            {/* Skill 3 */}
            <article className="glass-card p-6 flex items-start gap-4">
              <div className="shrink-0 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                {iconMap[aboutMeData?.skill3_icon || 'Brain']}
              </div>
              <div>
                <h3 className="font-semibold text-xl mb-2">
                  <EditableText
                    value={getValue('skill3_title', 'AI Innovation')}
                    isEditMode={isEditMode}
                    onChange={(value) => onChange({ skill3_title: value })}
                    placeholder="Skill 3 title"
                  />
                </h3>
                <p className="text-muted-foreground">
                  <EditableText
                    value={getValue('skill3_description', 'Description...')}
                    isEditMode={isEditMode}
                    onChange={(value) => onChange({ skill3_description: value })}
                    placeholder="Skill 3 description"
                    multiline
                  />
                </p>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EditableAboutSplitBlock;
