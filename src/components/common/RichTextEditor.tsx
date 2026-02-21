// ============================================
// Rich Text Editor Component
// Unified text editor with markdown preview and AI
// Composed from Toolbar, Preview sub-components
// ============================================

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Eye, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import RichTextToolbar, { type FormatAction } from './RichTextToolbar';
import RichTextPreview from './RichTextPreview';

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
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const before = value.substring(0, lineStart);
      const after = value.substring(lineStart);
      newText = before + action.prefix + after;
      newCursorPos = lineStart + action.prefix.length;
    } else {
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

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const previewToggle = (
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
  );

  return (
    <div className={cn('space-y-2', className)}>
      <RichTextToolbar
        onFormat={applyFormat}
        showPreview={showPreview}
        onTogglePreview={() => setShowPreview(!showPreview)}
        disabled={disabled}
        showAI={showAI}
        aiProps={{
          text: value,
          onTextChange: onChange,
          title,
          context: aiContext,
          mode: aiMode,
        }}
        previewToggle={previewToggle}
      />

      {showPreview ? (
        <RichTextPreview content={value} minHeight={minHeight} />
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
