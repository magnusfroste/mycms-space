// ============================================
// Rich Text Editor Component
// Unified text editor with markdown preview and AI
// ============================================

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Eye, Edit3, Bold, Italic, Heading1, Heading2, 
  Quote, List, ListOrdered, Link, Code, Minus 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import MarkdownContent from './MarkdownContent';
import AITextActions from './AITextActions';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  title?: string;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  showAI?: boolean;
  aiMode?: 'text' | 'content' | 'both';
  aiContext?: string;
  disabled?: boolean;
}

interface FormatAction {
  icon: React.ReactNode;
  label: string;
  prefix: string;
  suffix?: string;
  block?: boolean;
}

const formatActions: FormatAction[] = [
  { icon: <Bold className="h-4 w-4" />, label: 'Bold', prefix: '**', suffix: '**' },
  { icon: <Italic className="h-4 w-4" />, label: 'Italic', prefix: '_', suffix: '_' },
  { icon: <Heading1 className="h-4 w-4" />, label: 'Heading 1', prefix: '# ', block: true },
  { icon: <Heading2 className="h-4 w-4" />, label: 'Heading 2', prefix: '## ', block: true },
  { icon: <Quote className="h-4 w-4" />, label: 'Quote', prefix: '> ', block: true },
  { icon: <List className="h-4 w-4" />, label: 'List', prefix: '- ', block: true },
  { icon: <ListOrdered className="h-4 w-4" />, label: 'Ordered list', prefix: '1. ', block: true },
  { icon: <Code className="h-4 w-4" />, label: 'Code', prefix: '`', suffix: '`' },
  { icon: <Link className="h-4 w-4" />, label: 'Link', prefix: '[', suffix: '](url)' },
  { icon: <Minus className="h-4 w-4" />, label: 'Divider', prefix: '\n---\n', block: true },
];

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyFormat = (action: FormatAction) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    let newText: string;
    let newCursorPos: number;

    if (action.block) {
      // For block-level formatting, insert at line start
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const before = value.substring(0, lineStart);
      const after = value.substring(lineStart);
      newText = before + action.prefix + after;
      newCursorPos = lineStart + action.prefix.length;
    } else {
      // For inline formatting, wrap selection
      const before = value.substring(0, start);
      const after = value.substring(end);
      const suffix = action.suffix || '';
      
      if (selectedText) {
        newText = before + action.prefix + selectedText + suffix + after;
        newCursorPos = start + action.prefix.length + selectedText.length + suffix.length;
      } else {
        newText = before + action.prefix + suffix + after;
        newCursorPos = start + action.prefix.length;
      }
    }

    onChange(newText);
    
    // Restore focus and cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 flex-wrap border border-input rounded-md p-1 bg-muted/30">
        <TooltipProvider delayDuration={300}>
          {formatActions.map((action, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => applyFormat(action)}
                  disabled={disabled || showPreview}
                >
                  {action.icon}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{action.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
          
          <div className="h-6 w-px bg-border mx-1" />
          
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
          
          <div className="flex-1" />
          
          <Button
            type="button"
            variant={showPreview ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            disabled={disabled}
            className="gap-1"
          >
            {showPreview ? (
              <>
                <Edit3 className="h-4 w-4" />
                <span className="hidden sm:inline">Edit</span>
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">Preview</span>
              </>

            )}
          </Button>
        </TooltipProvider>
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
          ref={textareaRef}
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
