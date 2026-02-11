// ============================================
// Sortable Block Wrapper
// Drag-and-drop wrapper using @dnd-kit
// Shows either visual preview or inline editor
// ============================================

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { GripVertical, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PageBlock } from '@/types';
import InlineBlockEditor from './InlineBlockEditor';

interface SortableBlockWrapperProps {
  block: PageBlock;
  children: React.ReactNode;
  isEditing: boolean;
  pendingBlockChanges?: Record<string, unknown>;
  onBlockConfigChange: (config: Record<string, unknown>) => void;
  onStartEdit: () => void;
  onEndEdit: () => void;
  onDelete: () => void;
  onToggleEnabled: () => void;
}

import { blockTypeLabels } from '@/lib/constants/blockTypeLabels';

const SortableBlockWrapper: React.FC<SortableBlockWrapperProps> = ({
  block,
  children,
  isEditing,
  pendingBlockChanges,
  onBlockConfigChange,
  onStartEdit,
  onEndEdit,
  onDelete,
  onToggleEnabled,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // If editing, show the inline editor instead of the block preview
  if (isEditing) {
    return (
      <div ref={setNodeRef} style={style} className="px-4">
        <InlineBlockEditor
          block={block}
          pendingChanges={pendingBlockChanges}
          onBlockConfigChange={onBlockConfigChange}
          onDone={onEndEdit}
        />
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group transition-all duration-200',
        'border-2 border-transparent',
        'hover:border-primary/30',
        !block.enabled && 'opacity-50',
        isDragging && 'z-50 opacity-90 shadow-2xl scale-[1.02]'
      )}
    >
      {/* Block Controls Header */}
      <div
        className={cn(
          'absolute -top-10 left-0 right-0 z-20',
          'flex items-center justify-between',
          'bg-background/95 backdrop-blur border rounded-t-lg px-3 py-1.5',
          'opacity-0 group-hover:opacity-100 transition-opacity',
          isDragging && 'opacity-100'
        )}
      >
        {/* Left: Drag Handle + Block Type */}
        <div className="flex items-center gap-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded touch-none"
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
            className="h-7 px-2 bg-primary/10 hover:bg-primary/20"
            onClick={onStartEdit}
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

      {/* Block Content - Visual Preview */}
      <div className="pointer-events-none">
        {children}
      </div>
    </div>
  );
};

export default SortableBlockWrapper;
