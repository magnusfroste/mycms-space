// ============================================
// Editable Block Wrapper
// Visual container with controls for each block
// ============================================

import React from 'react';
import { Button } from '@/components/ui/button';
import { GripVertical, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PageBlock } from '@/types';

interface EditableBlockWrapperProps {
  block: PageBlock;
  children: React.ReactNode;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onToggleEnabled: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

const blockTypeLabels: Record<string, string> = {
  'hero': 'Hero',
  'about-split': 'About Me',
  'text-section': 'Text Section',
  'cta-banner': 'CTA Banner',
  'image-text': 'Image & Text',
  'spacer': 'Spacer',
  'featured-carousel': 'Featured Carousel',
  'expertise-grid': 'Expertise Grid',
  'project-showcase': 'Project Showcase',
  'chat-widget': 'Chat Widget',
};

const EditableBlockWrapper: React.FC<EditableBlockWrapperProps> = ({
  block,
  children,
  isSelected,
  onSelect,
  onDelete,
  onToggleEnabled,
  dragHandleProps,
}) => {
  return (
    <div
      className={cn(
        'relative group transition-all duration-200',
        'border-2 border-transparent',
        'hover:border-primary/30',
        isSelected && 'border-primary ring-2 ring-primary/20',
        !block.enabled && 'opacity-50'
      )}
    >
      {/* Block Controls Header */}
      <div
        className={cn(
          'absolute -top-10 left-0 right-0 z-20',
          'flex items-center justify-between',
          'bg-background/95 backdrop-blur border rounded-t-lg px-3 py-1.5',
          'opacity-0 group-hover:opacity-100 transition-opacity',
          isSelected && 'opacity-100'
        )}
      >
        {/* Left: Drag Handle + Block Type */}
        <div className="flex items-center gap-2">
          <div
            {...dragHandleProps}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {blockTypeLabels[block.block_type] || block.block_type}
          </span>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={onToggleEnabled}
            title={block.enabled ? 'Hide block' : 'Show block'}
          >
            {block.enabled ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-7 px-2',
              isSelected && 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
            onClick={onSelect}
          >
            <Pencil className="h-4 w-4" />
            <span className="ml-1 text-xs">Edit</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Block Content */}
      <div className={cn(
        'pointer-events-none',
        isSelected && 'pointer-events-auto'
      )}>
        {children}
      </div>
    </div>
  );
};

export default EditableBlockWrapper;
