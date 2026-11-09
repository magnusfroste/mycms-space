import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BlockRenderer } from '@/components/blocks';
import { usePageBlocks, usePageBlocksSubscription } from '@/models/pageBlocks';
import { useMainLandingPage } from '@/models/pages';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useHashScroll } from '@/hooks/useHashScroll';
import { getHeadingPlan } from '@/lib/utils/pageHeadings';
import { Skeleton } from '@/components/ui/skeleton';
import SEOHead from '@/components/common/SEOHead';

const Index = () => {
  // Track homepage visit
  useAnalytics('homepage');

  // Get main landing page
  const { data: mainPage } = useMainLandingPage();
  const pageSlug = mainPage?.slug || 'home';

  // Fetch blocks for main landing page
  const { data: blocks, isLoading } = usePageBlocks(pageSlug);
  
  // Subscribe to realtime updates
  usePageBlocksSubscription(pageSlug);

  // Support deep links like /#project-showcase once blocks have rendered
  useHashScroll(!isLoading && !!blocks);
  const headingPlan = getHeadingPlan(blocks);

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead />
      <Header />
      <main className="flex-grow">
        {!isLoading && headingPlan.needsFallbackH1 && (
          <h1 className="sr-only">{mainPage?.title || 'Magnus Froste'}</h1>
        )}
        {isLoading ? (
          <div className="container mx-auto px-4 py-12 space-y-8">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : (
          blocks?.map((block, index) => (
            <BlockRenderer 
              key={block.id} 
              block={block} 
              isLast={index === blocks.length - 1} 
              promoteHeading={index === headingPlan.promoteIndex}
            />
          ))
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
