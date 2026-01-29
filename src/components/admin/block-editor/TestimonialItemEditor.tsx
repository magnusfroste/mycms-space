// ============================================
// Testimonial Item Editor
// CRUD interface for testimonials with drag-and-drop
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
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, GripVertical, Star, Quote } from 'lucide-react';
import { cn } from '@/lib/utils';
import ImageUpload from './ImageUpload';

interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
  company?: string;
  avatar_url?: string;
  rating?: number;
}

interface TestimonialItemEditorProps {
  items: Testimonial[];
  onChange: (items: Testimonial[]) => void;
}

const defaultItem: Omit<Testimonial, 'id'> = {
  quote: 'Share what your client said about working with you...',
  author: 'Client Name',
  role: 'Position',
  company: 'Company',
  rating: 5,
};

// Rating Stars Component
const RatingStars = ({ rating, onChange }: { rating: number; onChange: (r: number) => void }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map(star => (
      <button
        key={star}
        type="button"
        onClick={() => onChange(star)}
        className={cn(
          'transition-colors',
          star <= rating ? 'text-yellow-500' : 'text-muted-foreground/30 hover:text-yellow-500/50'
        )}
      >
        <Star className="h-5 w-5 fill-current" />
      </button>
    ))}
  </div>
);

// Sortable Item Component
interface SortableTestimonialItemProps {
  item: Testimonial;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<Testimonial>) => void;
  onDelete: () => void;
}

const SortableTestimonialItem: React.FC<SortableTestimonialItemProps> = ({
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
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-sm font-semibold text-primary flex-shrink-0">
          {item.avatar_url ? (
            <img src={item.avatar_url} alt={item.author} className="w-full h-full rounded-full object-cover" />
          ) : (
            item.author.charAt(0)
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{item.author}</div>
          <div className="text-xs text-muted-foreground truncate">
            {item.role}{item.company && ` at ${item.company}`}
          </div>
        </div>
        <div className="flex gap-0.5 flex-shrink-0">
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i} 
              className={cn(
                'h-3 w-3',
                i < (item.rating || 0) ? 'text-yellow-500 fill-yellow-500' : 'text-muted'
              )} 
            />
          ))}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive flex-shrink-0"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {isExpanded && (
        <CardContent className="pt-0 pb-4 space-y-4 border-t">
          <div className="pt-4 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Quote className="h-4 w-4 text-primary" />
                <Label>Testimonial Quote</Label>
              </div>
              <Textarea
                value={item.quote}
                onChange={(e) => onUpdate({ quote: e.target.value })}
                placeholder="What did they say..."
                rows={4}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Author Name</Label>
                  <Input
                    value={item.author}
                    onChange={(e) => onUpdate({ author: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role / Position</Label>
                  <Input
                    value={item.role}
                    onChange={(e) => onUpdate({ role: e.target.value })}
                    placeholder="CEO"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company (optional)</Label>
                  <Input
                    value={item.company || ''}
                    onChange={(e) => onUpdate({ company: e.target.value })}
                    placeholder="Acme Inc."
                  />
                </div>
              </div>
              <div className="space-y-4">
                <ImageUpload
                  label="Avatar (optional)"
                  value={item.avatar_url || ''}
                  onChange={(url) => onUpdate({ avatar_url: url })}
                  bucket="about-me-images"
                />
                <div className="space-y-2">
                  <Label>Rating</Label>
                  <RatingStars 
                    rating={item.rating || 5}
                    onChange={(r) => onUpdate({ rating: r })}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

const TestimonialItemEditor: React.FC<TestimonialItemEditorProps> = ({ items, onChange }) => {
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
    const newItem: Testimonial = {
      ...defaultItem,
      id: crypto.randomUUID(),
    };
    onChange([...items, newItem]);
    setExpandedId(newItem.id);
  };

  const updateItem = (id: string, updates: Partial<Testimonial>) => {
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
        <Label className="text-base font-medium">Testimonials</Label>
        <Button onClick={addItem} size="sm" variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Testimonial
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((item) => (
              <SortableTestimonialItem
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
          <p>No testimonials yet. Click "Add Testimonial" to get started.</p>
        </div>
      )}
    </div>
  );
};

export default TestimonialItemEditor;
