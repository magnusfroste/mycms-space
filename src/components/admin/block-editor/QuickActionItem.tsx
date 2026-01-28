// ============================================
// Quick Action Item
// Individual quick action row with edit/delete
// ============================================

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { GripVertical, Pencil, Trash2, Check, X } from 'lucide-react';
import { iconMap } from '@/lib/constants/iconMaps';
import IconPicker from './IconPicker';
import type { QuickAction } from '@/types';

interface QuickActionItemProps {
  action: QuickAction;
  isEditing: boolean;
  editData: { icon: string; label: string; message: string };
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onEditChange: (data: { icon: string; label: string; message: string }) => void;
  onToggle: (enabled: boolean) => void;
  onDelete: () => void;
  isSaving?: boolean;
}

const QuickActionItem: React.FC<QuickActionItemProps> = ({
  action,
  isEditing,
  editData,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onEditChange,
  onToggle,
  onDelete,
  isSaving,
}) => {
  if (isEditing) {
    return (
      <Card className="p-3">
        <div className="space-y-3">
          <div className="flex gap-3 items-end">
            <div>
              <Label className="text-xs">Icon</Label>
              <IconPicker
                value={editData.icon}
                onChange={(v) => onEditChange({ ...editData, icon: v })}
              />
            </div>
            <div className="flex-1">
              <Label className="text-xs">Label</Label>
              <Input
                value={editData.label}
                onChange={(e) => onEditChange({ ...editData, label: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">Message</Label>
            <Input
              value={editData.message}
              onChange={(e) => onEditChange({ ...editData, message: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={onSaveEdit} size="sm" disabled={isSaving}>
              <Check className="h-4 w-4 mr-1" />
              Save
            </Button>
            <Button variant="ghost" size="sm" onClick={onCancelEdit}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-3">
      <div className="flex items-center gap-3">
        <GripVertical className="h-4 w-4 text-muted-foreground/50" />
        <div className="text-muted-foreground">
          {iconMap[action.icon] || action.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{action.label}</div>
          <div className="text-xs text-muted-foreground truncate">{action.message}</div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onStartEdit}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Switch checked={action.enabled} onCheckedChange={onToggle} />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};

export default QuickActionItem;
