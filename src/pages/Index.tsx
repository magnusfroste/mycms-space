import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BlockRenderer } from '@/components/blocks';
import { usePageBlocks, usePageBlocksSubscription } from '@/models/pageBlocks';
import { useMainLandingPage } from '@/models/pages';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Skeleton } from '@/components/ui/skeleton';

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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
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
            />
          ))
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
