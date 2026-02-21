// ============================================
// Rich Text Toolbar
// Markdown formatting buttons + AI actions
// ============================================

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Bold, Italic, Heading1, Heading2,
  Quote, List, ListOrdered, Link, Code, Minus
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import AITextActions from './AITextActions';

export interface FormatAction {
  icon: React.ReactNode;
  label: string;
  prefix: string;
  suffix?: string;
  block?: boolean;
}

export const formatActions: FormatAction[] = [
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

interface RichTextToolbarProps {
  onFormat: (action: FormatAction) => void;
  showPreview: boolean;
  onTogglePreview: () => void;
  disabled?: boolean;
  showAI?: boolean;
  aiProps?: {
    text: string;
    onTextChange: (value: string) => void;
    title?: string;
    context?: string;
    mode?: 'text' | 'content' | 'both';
  };
  previewToggle: React.ReactNode;
}

const RichTextToolbar: React.FC<RichTextToolbarProps> = ({
  onFormat,
  showPreview,
  disabled,
  showAI = true,
  aiProps,
  previewToggle,
}) => {
  return (
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
                onClick={() => onFormat(action)}
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

        {showAI && aiProps && (
          <AITextActions
            text={aiProps.text}
            onTextChange={aiProps.onTextChange}
            title={aiProps.title}
            context={aiProps.context}
            mode={aiProps.mode}
            disabled={disabled}
          />
        )}

        <div className="flex-1" />

        {previewToggle}
      </TooltipProvider>
    </div>
  );
};

export default RichTextToolbar;
