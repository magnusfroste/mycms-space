// ============================================
// Testimonial Item Editor
// CRUD interface for testimonials
// ============================================

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Star, Quote } from 'lucide-react';
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

const TestimonialItemEditor: React.FC<TestimonialItemEditorProps> = ({ items, onChange }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= items.length) return;
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
    onChange(newItems);
  };

  const RatingStars = ({ rating, onChange: onRatingChange }: { rating: number; onChange: (r: number) => void }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onRatingChange(star)}
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Testimonials</Label>
        <Button onClick={addItem} size="sm" variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Testimonial
        </Button>
      </div>

      <div className="space-y-2">
        {items.map((item, index) => (
          <Card 
            key={item.id} 
            className={cn(
              'transition-all duration-200',
              expandedId === item.id && 'ring-2 ring-primary'
            )}
          >
            <div 
              className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50"
              onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
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
              <div className="flex gap-0.5">
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
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => { e.stopPropagation(); moveItem(index, 'up'); }}
                  disabled={index === 0}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => { e.stopPropagation(); moveItem(index, 'down'); }}
                  disabled={index === items.length - 1}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {expandedId === item.id && (
              <CardContent className="pt-0 pb-4 space-y-4 border-t">
                <div className="pt-4 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Quote className="h-4 w-4 text-primary" />
                      <Label>Testimonial Quote</Label>
                    </div>
                    <Textarea
                      value={item.quote}
                      onChange={(e) => updateItem(item.id, { quote: e.target.value })}
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
                          onChange={(e) => updateItem(item.id, { author: e.target.value })}
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Role / Position</Label>
                        <Input
                          value={item.role}
                          onChange={(e) => updateItem(item.id, { role: e.target.value })}
                          placeholder="CEO"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Company (optional)</Label>
                        <Input
                          value={item.company || ''}
                          onChange={(e) => updateItem(item.id, { company: e.target.value })}
                          placeholder="Acme Inc."
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <ImageUpload
                        label="Avatar (optional)"
                        value={item.avatar_url || ''}
                        onChange={(url) => updateItem(item.id, { avatar_url: url })}
                        bucket="about-me-images"
                      />
                      <div className="space-y-2">
                        <Label>Rating</Label>
                        <RatingStars 
                          rating={item.rating || 5}
                          onChange={(r) => updateItem(item.id, { rating: r })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}

        {items.length === 0 && (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
            <p>No testimonials yet. Click "Add Testimonial" to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestimonialItemEditor;
