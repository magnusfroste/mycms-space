import React from 'react';
import { useAboutMeSettings } from '@/hooks/useAboutMeSettings';
import { Skeleton } from '@/components/ui/skeleton';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Card, CardContent } from '@/components/ui/card';
import { iconMap } from '@/lib/constants/iconMaps';

interface AboutMeProps {
  title?: string;
  subtitle?: string;
}

const AboutMe: React.FC<AboutMeProps> = ({ 
  title = 'About Me',
  subtitle 
}) => {
  const { data: aboutMeData, isLoading } = useAboutMeSettings();

  return (
    <section id="about" className="py-20 bg-card" aria-labelledby="about-heading">
      <div className="container mx-auto px-4">
        <h2 id="about-heading" className="section-title">{title}</h2>
        {subtitle && (
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            {subtitle}
          </p>
        )}
        
        {isLoading ? (
          // Loading state
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
              {aboutMeData?.image_url ? (
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
              ) : null}
              
              <p className="text-lg text-foreground/80 leading-relaxed">
                {aboutMeData?.intro_text || 'With over 20 years of experience in innovation strategy and product development, I help businesses integrate cutting-edge AI solutions to drive growth and efficiency.'}
              </p>
              
              <p className="text-lg text-foreground/80 leading-relaxed">
                {aboutMeData?.additional_text || 'My approach combines technical expertise with business acumen, ensuring that technological advancements translate directly into measurable business outcomes.'}
              </p>
            </div>
            
            <div className="space-y-6">
              <article className="glass-card p-6 flex items-start gap-4">
                <div className="shrink-0 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  {iconMap[aboutMeData?.skill1_icon || 'Monitor']}
                </div>
                <div>
                  <h3 className="font-semibold text-xl mb-2">{aboutMeData?.skill1_title || 'AI Integration'}</h3>
                  <p className="text-muted-foreground">
                    {aboutMeData?.skill1_description || 'Specialized in integrating AI solutions that drive business value and enhance operational efficiency.'}
                  </p>
                </div>
              </article>
              
              <article className="glass-card p-6 flex items-start gap-4">
                <div className="shrink-0 w-12 h-12 rounded-full bg-apple-blue/20 flex items-center justify-center">
                  {iconMap[aboutMeData?.skill2_icon || 'Rocket']}
                </div>
                <div>
                  <h3 className="font-semibold text-xl mb-2">{aboutMeData?.skill2_title || 'Product Strategy'}</h3>
                  <p className="text-muted-foreground">
                    {aboutMeData?.skill2_description || 'Expert in product development with a focus on market fit and scalable growth strategies.'}
                  </p>
                </div>
              </article>
              
              <article className="glass-card p-6 flex items-start gap-4">
                <div className="shrink-0 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  {iconMap[aboutMeData?.skill3_icon || 'Brain']}
                </div>
                <div>
                  <h3 className="font-semibold text-xl mb-2">{aboutMeData?.skill3_title || 'Innovation Leadership'}</h3>
                  <p className="text-muted-foreground">
                    {aboutMeData?.skill3_description || 'Guiding organizations through digital transformation with strategic innovation frameworks.'}
                  </p>
                </div>
              </article>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default AboutMe;
