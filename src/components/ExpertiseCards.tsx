import React from 'react';
import { Lightbulb } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useExpertiseWithFallback } from '@/hooks/useExpertiseWithFallback';
import { iconMap } from '@/lib/constants/iconMaps';

const ExpertiseCards = () => {
  const { expertise: areasToDisplay, isLoading } = useExpertiseWithFallback();

  return (
    <section id="expertise" className="py-20 bg-card">
      <div className="container mx-auto px-4">
        <h2 className="section-title">Areas of Expertise</h2>
        
        {isLoading ? (
          // Loading state
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
            {areasToDisplay.map((area) => (
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

export default ExpertiseCards;
