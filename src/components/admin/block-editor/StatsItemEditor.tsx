// ============================================
// Stats Counter Item Editor
// CRUD interface for statistics items with drag-and-drop
// ============================================

import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatItem {
  id: string;
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  description?: string;
}

interface StatsItemEditorProps {
  items: StatItem[];
  onChange: (items: StatItem[]) => void;
}

const defaultItem: Omit<StatItem, 'id'> = {
  value: 100,
  suffix: '+',
  label: 'New Stat',
  description: 'Stat description',
};

const formatDisplayValue = (item: StatItem) => {
  return `${item.prefix || ''}${item.value}${item.suffix || ''}`;
};

// Sortable Item Component
interface SortableStatItemProps {
  item: StatItem;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<StatItem>) => void;
  onDelete: () => void;
}

const SortableStatItem: React.FC<SortableStatItemProps> = ({
  item,
  isExpanded,
  onToggle,
  onUpdate,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      className={cn(
        'transition-all duration-200',
        isExpanded && 'ring-2 ring-primary',
        isDragging && 'opacity-50 shadow-lg'
      )}
    >
      <div 
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50"
        onClick={onToggle}
      >
        <div 
          {...attributes} 
          {...listeners}
          className="cursor-grab active:cursor-grabbing touch-none"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-lg tabular-nums">{formatDisplayValue(item)}</div>
          <div className="text-sm text-muted-foreground truncate">{item.label}</div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {isExpanded && (
        <CardContent className="pt-0 pb-4 space-y-4 border-t">
          <div className="grid gap-4 grid-cols-3 pt-4">
            <div className="space-y-2">
              <Label>Prefix</Label>
              <Input
                value={item.prefix || ''}
                onChange={(e) => onUpdate({ prefix: e.target.value })}
                placeholder="$"
                className="text-center"
              />
              <p className="text-xs text-muted-foreground">e.g. $, €</p>
            </div>
            <div className="space-y-2">
              <Label>Value</Label>
              <Input
                type="number"
                value={item.value}
                onChange={(e) => onUpdate({ value: parseInt(e.target.value) || 0 })}
                className="text-center font-bold"
              />
              <p className="text-xs text-muted-foreground">Number</p>
            </div>
            <div className="space-y-2">
              <Label>Suffix</Label>
              <Input
                value={item.suffix || ''}
                onChange={(e) => onUpdate({ suffix: e.target.value })}
                placeholder="+"
                className="text-center"
              />
              <p className="text-xs text-muted-foreground">e.g. +, %, K, M</p>
            </div>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <span className="text-2xl font-bold">{formatDisplayValue(item)}</span>
            <p className="text-xs text-muted-foreground mt-1">Preview</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Label</Label>
              <Input
                value={item.label}
                onChange={(e) => onUpdate({ label: e.target.value })}
                placeholder="Projects Completed"
              />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Input
                value={item.description || ''}
                onChange={(e) => onUpdate({ description: e.target.value })}
                placeholder="Successful deliveries"
              />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

const StatsItemEditor: React.FC<StatsItemEditorProps> = ({ items, onChange }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(item => item.id === active.id);
      const newIndex = items.findIndex(item => item.id === over.id);
      onChange(arrayMove(items, oldIndex, newIndex));
    }
  };

  const addItem = () => {
    const newItem: StatItem = {
      ...defaultItem,
      id: crypto.randomUUID(),
    };
    onChange([...items, newItem]);
    setExpandedId(newItem.id);
  };

  const updateItem = (id: string, updates: Partial<StatItem>) => {
    onChange(items.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const deleteItem = (id: string) => {
    onChange(items.filter(item => item.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Statistics</Label>
        <Button onClick={addItem} size="sm" variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Stat
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((item) => (
              <SortableStatItem
                key={item.id}
                item={item}
                isExpanded={expandedId === item.id}
                onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
                onUpdate={(updates) => updateItem(item.id, updates)}
                onDelete={() => deleteItem(item.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {items.length === 0 && (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <p>No statistics yet. Click "Add Stat" to get started.</p>
        </div>
      )}
    </div>
  );
};

export default StatsItemEditor;
