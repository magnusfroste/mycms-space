import React from 'react';
import { useParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BlockRenderer } from '@/components/blocks';
import { usePageBlocks, usePageBlocksSubscription } from '@/models/pageBlocks';
import { usePageBySlug } from '@/models/pages';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useHashScroll } from '@/hooks/useHashScroll';
import { Skeleton } from '@/components/ui/skeleton';
import SEOHead from '@/components/common/SEOHead';
import { getHeadingPlan } from '@/lib/utils/pageHeadings';
import NotFound from './NotFound';

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
  useHashScroll(!isLoading && !!page);

  // Unknown or unpublished page (RLS hides disabled pages from visitors):
  // render 404 in place and keep the requested URL
  if (!pageLoading && !page) {
    return <NotFound />;
  }

  const headingPlan = getHeadingPlan(blocks);

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title={page?.title}
        description={page?.description || undefined}
      />
      <Header />
      <main className="flex-grow">
        {!isLoading && headingPlan.needsFallbackH1 && page?.title && (
          <div className="container mx-auto px-4 pt-12">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{page.title}</h1>
            {page.description && <p className="mt-4 max-w-2xl text-muted-foreground">{page.description}</p>}
          </div>
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

export default DynamicPage;
