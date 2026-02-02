// ============================================
// Rich Text Editor Component
// Unified text editor with markdown preview and AI
// ============================================

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Eye, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import MarkdownContent from './MarkdownContent';
import AITextActions from './AITextActions';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  title?: string; // For AI content generation
  placeholder?: string;
  className?: string;
  minHeight?: string;
  showAI?: boolean;
  aiMode?: 'text' | 'content' | 'both';
  aiContext?: string;
  disabled?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  title,
  placeholder = 'Write content in Markdown...',
  className,
  minHeight = 'min-h-[200px]',
  showAI = true,
  aiMode = 'text',
  aiContext,
  disabled,
}) => {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className={cn('space-y-2', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-end gap-1">
        {showAI && (
          <AITextActions
            text={value}
            onTextChange={onChange}
            title={title}
            context={aiContext}
            mode={aiMode}
            disabled={disabled}
          />
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
          disabled={disabled}
        >
          {showPreview ? (
            <>
              <Edit3 className="h-4 w-4 mr-1" />
              Edit
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </>
          )}
        </Button>
      </div>

      {/* Editor / Preview */}
      {showPreview ? (
        <div
          className={cn(
            'rounded-md border border-input bg-background p-4',
            minHeight
          )}
        >
          {value ? (
            <MarkdownContent content={value} />
          ) : (
            <p className="text-muted-foreground italic">No content yet</p>
          )}
        </div>
      ) : (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn('font-mono text-sm', minHeight)}
        />
      )}
    </div>
  );
};

export default RichTextEditor;
