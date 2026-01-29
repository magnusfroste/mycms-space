import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BlockRenderer } from '@/components/blocks';
import { usePageBlocks, usePageBlocksSubscription } from '@/models/pageBlocks';
import { usePageBySlug } from '@/models/pages';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Skeleton } from '@/components/ui/skeleton';

const DynamicPage = () => {
  const { slug } = useParams<{ slug: string }>();
  
  // Track page visit
  useAnalytics(slug || 'unknown');

  // Fetch page metadata
  const { data: page, isLoading: pageLoading } = usePageBySlug(slug || '');
  
  // Fetch blocks for this page
  const { data: blocks, isLoading: blocksLoading } = usePageBlocks(slug || '');
  
  // Subscribe to realtime updates
  usePageBlocksSubscription(slug || '');

  const isLoading = pageLoading || blocksLoading;

  // If page doesn't exist or is not enabled, redirect to 404
  if (!pageLoading && !page) {
    return <Navigate to="/404" replace />;
  }

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

export default DynamicPage;
