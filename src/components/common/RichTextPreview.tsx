// ============================================
// Rich Text Preview
// Renders markdown content or empty state
// ============================================

import React from 'react';
import { cn } from '@/lib/utils';
import MarkdownContent from './MarkdownContent';

interface RichTextPreviewProps {
  content: string;
  minHeight?: string;
}

const RichTextPreview: React.FC<RichTextPreviewProps> = ({
  content,
  minHeight = 'min-h-[200px]',
}) => {
  return (
    <div className={cn('rounded-md border border-input bg-background p-4', minHeight)}>
      {content ? (
        <MarkdownContent content={content} />
      ) : (
        <p className="text-muted-foreground italic">No content yet</p>
      )}
    </div>
  );
};

export default RichTextPreview;
