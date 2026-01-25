import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BlockRenderer } from '@/components/blocks';
import { usePageBlocks, usePageBlocksSubscription } from '@/models/pageBlocks';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Skeleton } from '@/components/ui/skeleton';

const Index = () => {
  // Track homepage visit
  useAnalytics('homepage');

  // Fetch blocks for home page
  const { data: blocks, isLoading } = usePageBlocks('home');
  
  // Subscribe to realtime updates
  usePageBlocksSubscription('home');

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
          blocks?.map((block) => (
            <BlockRenderer key={block.id} block={block} />
          ))
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
