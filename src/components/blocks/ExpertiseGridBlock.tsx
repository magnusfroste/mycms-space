// ============================================
// Expertise Grid Block
// Reads expertise items from block_config JSONB
// ============================================

import React from 'react';
import { Lightbulb } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { iconMap } from '@/lib/constants/iconMaps';
import type { ExpertiseGridBlockConfig } from '@/types/blockConfigs';

interface ExpertiseGridBlockProps {
  config: Record<string, unknown>;
}

const ExpertiseGridBlock: React.FC<ExpertiseGridBlockProps> = ({ config }) => {
  const typedConfig = config as ExpertiseGridBlockConfig;
  
  const title = typedConfig.title || 'Areas of Expertise';
  const subtitle = typedConfig.subtitle;
  const items = typedConfig.items?.filter(item => item.enabled) || [];

  const isLoading = !typedConfig.items;

  return (
    <section id="expertise" className="py-20 bg-card">
      <div className="container mx-auto px-4">
        <h2 className="section-title">{title}</h2>
        {subtitle && (
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            {subtitle}
          </p>
        )}
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="glass-card p-6 h-full">
                <div className="flex items-start mb-4">
                  <Skeleton className="h-12 w-12 rounded-lg mr-4" />
                  <Skeleton className="h-6 w-40" />
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-2" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((area) => (
              <div key={area.id} className="glass-card p-6 h-full">
                <div className="flex items-start mb-4">
                  <div className="mr-4 p-3 bg-background rounded-lg shadow-sm">
                    {iconMap[area.icon] || <Lightbulb className="h-6 w-6 text-apple-purple" />}
                  </div>
                  <h3 className="text-xl font-semibold">{area.title}</h3>
                </div>
                <p className="text-muted-foreground">{area.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ExpertiseGridBlock;
