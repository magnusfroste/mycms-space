// ============================================
// Markdown Content Component
// Unified markdown rendering using react-markdown
// ============================================

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import { cn } from '@/lib/utils';

interface MarkdownContentProps {
  content: string;
  className?: string;
  compact?: boolean;
}

// Preprocess content to preserve extra blank lines as visible spacing
const preprocessContent = (text: string): string => {
  // Convert 3+ consecutive newlines (2+ blank lines) to paragraph + spacer
  // This preserves intentional extra spacing in the source
  return text.replace(/\n{3,}/g, '\n\n&nbsp;\n\n');
};

const MarkdownContent: React.FC<MarkdownContentProps> = ({
  content,
  className,
  compact = false,
}) => {
  if (!content) return null;

  const processedContent = preprocessContent(content);

  return (
    <div
      className={cn(
        'prose prose-sm dark:prose-invert max-w-none',
        // Base typography
        'prose-headings:font-semibold prose-headings:tracking-tight',
        'prose-p:leading-relaxed prose-p:mb-4',
        'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
        // Lists
        'prose-ul:my-2 prose-ol:my-2',
        'prose-li:my-0.5',
        // Code
        'prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-sm',
        'prose-pre:bg-muted prose-pre:border prose-pre:border-border',
        // Blockquotes
        'prose-blockquote:border-l-primary prose-blockquote:bg-muted/30 prose-blockquote:py-1 prose-blockquote:not-italic',
        // Strong & emphasis
        'prose-strong:font-semibold prose-strong:text-foreground',
        'prose-em:text-muted-foreground',
        // Compact mode for chat/small areas
        compact && 'text-sm prose-p:my-1 prose-headings:my-2',
        className
      )}
    >
      <ReactMarkdown 
        remarkPlugins={[remarkBreaks]} 
        rehypePlugins={[rehypeRaw]}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownContent;
