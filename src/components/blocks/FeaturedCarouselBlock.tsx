// ============================================
// Featured Carousel Block
// Reads featured items from block_config JSONB
// ============================================

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { FeaturedCarouselBlockConfig } from '@/types/blockConfigs';

interface FeaturedCarouselBlockProps {
  config: Record<string, unknown>;
}

const FeaturedCarouselBlock: React.FC<FeaturedCarouselBlockProps> = ({ config }) => {
  const typedConfig = config as FeaturedCarouselBlockConfig;
  const [activeIndex, setActiveIndex] = useState(0);
  
  const title = typedConfig.title || 'Featured In...';
  const subtitle = typedConfig.subtitle;
  const items = typedConfig.items?.filter(item => item.enabled) || [];

  const isLoading = !typedConfig.items;

  const goToPrevious = () => {
    setActiveIndex((current) => (current === 0 ? items.length - 1 : current - 1));
  };

  const goToNext = () => {
    setActiveIndex((current) => (current === items.length - 1 ? 0 : current + 1));
  };

  if (items.length === 0 && !isLoading) {
    return null;
  }

  return (
    <section id="featured" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center mb-4">
          <Image className="h-8 w-8 text-apple-purple mr-3" />
          <h2 className="section-title mb-0">{title}</h2>
        </div>
        {subtitle && (
          <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
            {subtitle}
          </p>
        )}
        
        <div className="relative max-w-5xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 text-muted-foreground hover:text-primary bg-background/60 rounded-full"
            onClick={goToPrevious}
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 text-muted-foreground hover:text-primary bg-background/60 rounded-full"
            onClick={goToNext}
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
          
          {isLoading ? (
            <div className="glass-card p-6 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <Skeleton className="h-80 w-full rounded-xl" />
                <div className="space-y-4">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card p-8 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="bg-muted rounded-xl p-4">
                  <div className="h-72 rounded-lg flex items-center justify-center overflow-hidden bg-background">
                    {items[activeIndex]?.image_url ? (
                      <img 
                        src={items[activeIndex].image_url} 
                        alt={items[activeIndex].title}
                        className="object-contain w-full h-full rounded-lg"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-muted-foreground">
                        <Image className="h-12 w-12 mb-2" />
                        <span>Image not available</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-2xl font-semibold mb-4">{items[activeIndex]?.title}</h3>
                  <p className="text-muted-foreground mb-6">{items[activeIndex]?.description}</p>
                  
                  <div className="flex justify-center space-x-2">
                    {items.map((_, index) => (
                      <button
                        key={index}
                        className={`w-3 h-3 rounded-full ${
                          activeIndex === index ? 'bg-primary' : 'bg-muted-foreground/30'
                        }`}
                        onClick={() => setActiveIndex(index)}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCarouselBlock;
