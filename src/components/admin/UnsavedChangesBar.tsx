// ============================================
// Unsaved Changes Bar
// Floating bar that appears when there are unsaved changes
// ============================================

import React from 'react';
import { Button } from '@/components/ui/button';
import { Save, RotateCcw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UnsavedChangesBarProps {
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => void;
  onDiscard?: () => void;
  className?: string;
  saveLabel?: string;
  discardLabel?: string;
}

const UnsavedChangesBar: React.FC<UnsavedChangesBarProps> = ({
  isDirty,
  isSaving,
  onSave,
  onDiscard,
  className,
  saveLabel = 'Save changes',
  discardLabel = 'Discard',
}) => {
  if (!isDirty && !isSaving) return null;

  return (
    <div
      className={cn(
        'fixed bottom-4 left-1/2 -translate-x-1/2 z-50',
        'flex items-center gap-3 px-4 py-2',
        'bg-card border border-border rounded-full shadow-lg',
        'animate-in slide-in-from-bottom-4 fade-in duration-200',
        className
      )}
    >
      <span className="text-sm text-muted-foreground">
        {isSaving ? 'Saving...' : 'Unsaved changes'}
      </span>
      
      {onDiscard && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDiscard}
          disabled={isSaving}
          className="h-8"
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          {discardLabel}
        </Button>
      )}
      
      <Button
        size="sm"
        onClick={onSave}
        disabled={isSaving}
        className="h-8"
      >
        {isSaving ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <Save className="h-4 w-4 mr-1" />
        )}
        {saveLabel}
      </Button>
    </div>
  );
};

export default UnsavedChangesBar;
