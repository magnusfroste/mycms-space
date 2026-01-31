// ============================================
// About Split Block
// Reads about data from block_config JSONB
// ============================================

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Card, CardContent } from '@/components/ui/card';
import { iconMap } from '@/lib/constants/iconMaps';
import type { AboutSplitBlockConfig } from '@/types/blockConfigs';

interface AboutSplitBlockProps {
  config: Record<string, unknown>;
}

const AboutSplitBlock: React.FC<AboutSplitBlockProps> = ({ config }) => {
  const typedConfig = config as AboutSplitBlockConfig;
  
  const name = typedConfig.name;
  const introText = typedConfig.intro_text || 'Introduction text...';
  const additionalText = typedConfig.additional_text || 'Additional text...';
  const imageUrl = typedConfig.image_url;
  const skills = typedConfig.skills || [];

  const isLoading = !typedConfig.name;

  return (
    <section id="about" className="py-20 bg-card" aria-labelledby="about-heading">
      <div className="container mx-auto px-4">
        <h2 id="about-heading" className="section-title">About Me</h2>
        
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-5/6" />
              <Skeleton className="h-6 w-4/5" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-3/4" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              {imageUrl && (
                <div className="mb-8">
                  <Card className="overflow-hidden border-0 shadow-lg rounded-2xl bg-gradient-to-br from-primary/10 to-apple-blue/10 w-4/5 mx-auto">
                    <CardContent className="p-4">
                      <AspectRatio ratio={16/9} className="bg-muted rounded-xl overflow-hidden">
                        <img 
                          src={imageUrl} 
                          alt={name || "Profile"} 
                          className="object-cover w-full h-full"
                        />
                      </AspectRatio>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              <p className="text-lg text-foreground/80 leading-relaxed">
                {introText}
              </p>
              
              <p className="text-lg text-foreground/80 leading-relaxed">
                {additionalText}
              </p>
            </div>
            
            <div className="space-y-6">
              {skills.map((skill, index) => (
                <article key={index} className="glass-card p-6 flex items-start gap-4">
                  <div className={`shrink-0 w-12 h-12 rounded-full ${index % 2 === 0 ? 'bg-primary/20' : 'bg-apple-blue/20'} flex items-center justify-center`}>
                    {iconMap[skill.icon] || iconMap['Monitor']}
                  </div>
                  <div>
                    <h3 className="font-semibold text-xl mb-2">{skill.title}</h3>
                    <p className="text-muted-foreground">
                      {skill.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default AboutSplitBlock;
