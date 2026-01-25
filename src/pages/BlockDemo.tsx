// ============================================
// Block Demo Page
// Dynamic page rendered from page_blocks
// ============================================

import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BlockRenderer } from '@/components/blocks';
import { usePageBlocks, usePageBlocksSubscription } from '@/models/pageBlocks';
import { Skeleton } from '@/components/ui/skeleton';

const BlockDemo = () => {
  const pageSlug = 'demo';
  const { data: blocks, isLoading, error } = usePageBlocks(pageSlug);
  
  // Subscribe to realtime updates
  usePageBlocksSubscription(pageSlug);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-2">Error Loading Page</h1>
            <p className="text-muted-foreground">Unable to load page blocks.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow">
        {isLoading ? (
          // Loading skeleton
          <div className="space-y-8 py-16">
            <div className="container mx-auto px-4">
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
            <div className="container mx-auto px-4">
              <Skeleton className="h-32 w-full max-w-3xl mx-auto rounded-xl" />
            </div>
            <div className="container mx-auto px-4">
              <div className="grid md:grid-cols-3 gap-8">
                <Skeleton className="h-48 rounded-xl" />
                <Skeleton className="h-48 rounded-xl" />
                <Skeleton className="h-48 rounded-xl" />
              </div>
            </div>
          </div>
        ) : blocks && blocks.length > 0 ? (
          // Render blocks
          blocks.map((block) => (
            <BlockRenderer key={block.id} block={block} />
          ))
        ) : (
          // Empty state
          <div className="flex-grow flex items-center justify-center py-20">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">No Blocks Configured</h2>
              <p className="text-muted-foreground">
                Add blocks to the "demo" page in the admin panel.
              </p>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default BlockDemo;
