// ============================================
// Bento Grid Item Editor
// CRUD interface for bento grid items with drag-and-drop
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Plus, 
  Trash2, 
  GripVertical,
  Sparkles,
  Zap,
  Shield,
  Palette,
  Code,
  Rocket,
  Star,
  Heart,
  Globe,
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BentoItem {
  id: string;
  title: string;
  description: string;
  icon?: string;
  image_url?: string;
  size: 'small' | 'medium' | 'large';
  gradient?: string;
}

interface BentoItemEditorProps {
  items: BentoItem[];
  onChange: (items: BentoItem[]) => void;
}

const iconOptions = [
  { value: 'sparkles', label: 'Sparkles', icon: Sparkles },
  { value: 'zap', label: 'Zap', icon: Zap },
  { value: 'shield', label: 'Shield', icon: Shield },
  { value: 'palette', label: 'Palette', icon: Palette },
  { value: 'code', label: 'Code', icon: Code },
  { value: 'rocket', label: 'Rocket', icon: Rocket },
  { value: 'star', label: 'Star', icon: Star },
  { value: 'heart', label: 'Heart', icon: Heart },
  { value: 'globe', label: 'Globe', icon: Globe },
  { value: 'layers', label: 'Layers', icon: Layers },
];

const gradientOptions = [
  { value: 'from-purple-500/20 to-pink-500/20', label: 'Purple → Pink' },
  { value: 'from-yellow-500/20 to-orange-500/20', label: 'Yellow → Orange' },
  { value: 'from-green-500/20 to-emerald-500/20', label: 'Green → Emerald' },
  { value: 'from-blue-500/20 to-cyan-500/20', label: 'Blue → Cyan' },
  { value: 'from-indigo-500/20 to-violet-500/20', label: 'Indigo → Violet' },
  { value: 'from-rose-500/20 to-red-500/20', label: 'Rose → Red' },
  { value: 'from-teal-500/20 to-green-500/20', label: 'Teal → Green' },
  { value: 'from-amber-500/20 to-yellow-500/20', label: 'Amber → Yellow' },
];

const sizeOptions = [
  { value: 'small', label: 'Small (1x1)' },
  { value: 'medium', label: 'Medium (2x1)' },
  { value: 'large', label: 'Large (2x2)' },
];

const defaultItem: Omit<BentoItem, 'id'> = {
  title: 'New Feature',
  description: 'Describe this feature...',
  icon: 'sparkles',
  size: 'small',
  gradient: 'from-purple-500/20 to-pink-500/20',
};

const getIconComponent = (iconName: string) => {
  const option = iconOptions.find(o => o.value === iconName);
  return option ? <option.icon className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />;
};

// Sortable Item Component
interface SortableBentoItemProps {
  item: BentoItem;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<BentoItem>) => void;
  onDelete: () => void;
}

const SortableBentoItem: React.FC<SortableBentoItemProps> = ({
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
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          {getIconComponent(item.icon || 'sparkles')}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{item.title}</div>
          <div className="text-xs text-muted-foreground capitalize">{item.size}</div>
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
          <div className="grid gap-4 md:grid-cols-2 pt-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={item.title}
                onChange={(e) => onUpdate({ title: e.target.value })}
                placeholder="Feature title"
              />
            </div>
            <div className="space-y-2">
              <Label>Size</Label>
              <Select
                value={item.size}
                onValueChange={(value) => onUpdate({ size: value as BentoItem['size'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sizeOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={item.description}
              onChange={(e) => onUpdate({ description: e.target.value })}
              placeholder="Describe this feature..."
              rows={2}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Icon</Label>
              <Select
                value={item.icon || 'sparkles'}
                onValueChange={(value) => onUpdate({ icon: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <opt.icon className="h-4 w-4" />
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Gradient</Label>
              <Select
                value={item.gradient || gradientOptions[0].value}
                onValueChange={(value) => onUpdate({ gradient: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {gradientOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <div className={cn('w-4 h-4 rounded bg-gradient-to-r', opt.value.replace('/20', '/50'))} />
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Image URL (optional)</Label>
            <Input
              value={item.image_url || ''}
              onChange={(e) => onUpdate({ image_url: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
};

const BentoItemEditor: React.FC<BentoItemEditorProps> = ({ items, onChange }) => {
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
    const newItem: BentoItem = {
      ...defaultItem,
      id: crypto.randomUUID(),
    };
    onChange([...items, newItem]);
    setExpandedId(newItem.id);
  };

  const updateItem = (id: string, updates: Partial<BentoItem>) => {
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
        <Label className="text-base font-medium">Bento Grid Items</Label>
        <Button onClick={addItem} size="sm" variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((item) => (
              <SortableBentoItem
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
          <p>No items yet. Click "Add Item" to get started.</p>
        </div>
      )}
    </div>
  );
};

export default BentoItemEditor;
