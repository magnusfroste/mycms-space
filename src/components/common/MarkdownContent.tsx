// ============================================
// Markdown Content Component
// Unified markdown rendering using react-markdown
// ============================================

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface MarkdownContentProps {
  content: string;
  className?: string;
  compact?: boolean;
}

// Preprocess content to preserve blank lines as visible spacing
// Double newline (\n\n) in markdown = paragraph break, we convert to extra spacing
const preprocessContent = (text: string): string => {
  // Convert 2+ consecutive newlines to paragraph + spacer for extra visual spacing
  // This makes a single blank line in the editor create visible space
  return text.replace(/\n\n+/g, '\n\n&nbsp;\n\n');
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
        remarkPlugins={[remarkBreaks, remarkGfm]} 
        rehypePlugins={[rehypeRaw]}
        components={{
          table: ({ children }) => <Table>{children}</Table>,
          thead: ({ children }) => <TableHeader>{children}</TableHeader>,
          tbody: ({ children }) => <TableBody>{children}</TableBody>,
          tr: ({ children }) => <TableRow>{children}</TableRow>,
          th: ({ children }) => <TableHead>{children}</TableHead>,
          td: ({ children }) => <TableCell>{children}</TableCell>,
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownContent;
