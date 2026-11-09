// ============================================
// Markdown Content Component (lazy)
// Thin wrapper that code-splits the markdown pipeline
// (react-markdown + remark/rehype + parse5, ~250 KB) out of the
// main bundle. While the chunk loads, a plain-text approximation of
// the content is rendered so text is visible immediately and layout
// shift is minimal.
// ============================================

import React, { Suspense, lazy } from 'react';
import { cn } from '@/lib/utils';
import type { MarkdownContentProps } from './MarkdownRenderer';
import { loadMarkdownRenderer } from './markdownLoader';

const MarkdownRenderer = lazy(loadMarkdownRenderer);

// Very small markdown -> plain text approximation for the fallback
const toPlainText = (text: string): string =>
  text
    .replace(/<[^>]+>/g, '')                    // html tags
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')       // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')    // links -> text
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, '') // headings, quotes, list markers
    .replace(/(\*\*|__|\*|_|~~|`)/g, '')        // emphasis / code markers
    .replace(/^\s*\|?[\s:-]+\|[\s|:-]*$/gm, '') // table separator rows
    .trim();

const MarkdownContent: React.FC<MarkdownContentProps> = (props) => {
  if (!props.content) return null;

  return (
    <Suspense
      fallback={
        <div
          className={cn(
            'prose prose-sm dark:prose-invert max-w-none whitespace-pre-line',
            props.compact && 'text-sm',
            props.className
          )}
        >
          {toPlainText(props.content)}
        </div>
      }
    >
      <MarkdownRenderer {...props} />
    </Suspense>
  );
};

export type { MarkdownContentProps };
export default MarkdownContent;
