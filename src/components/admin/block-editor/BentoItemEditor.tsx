// ============================================
// Bento Grid Item Editor
// CRUD interface for bento grid items
// ============================================

import React, { useState } from 'react';
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
  ChevronDown, 
  ChevronUp,
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

const BentoItemEditor: React.FC<BentoItemEditorProps> = ({ items, onChange }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= items.length) return;
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
    onChange(newItems);
  };

  const IconComponent = (iconName: string) => {
    const option = iconOptions.find(o => o.value === iconName);
    return option ? <option.icon className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />;
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
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                {IconComponent(item.icon || 'sparkles')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{item.title}</div>
                <div className="text-xs text-muted-foreground capitalize">{item.size}</div>
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
                <div className="grid gap-4 md:grid-cols-2 pt-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={item.title}
                      onChange={(e) => updateItem(item.id, { title: e.target.value })}
                      placeholder="Feature title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Size</Label>
                    <Select
                      value={item.size}
                      onValueChange={(value) => updateItem(item.id, { size: value as BentoItem['size'] })}
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
                    onChange={(e) => updateItem(item.id, { description: e.target.value })}
                    placeholder="Describe this feature..."
                    rows={2}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Icon</Label>
                    <Select
                      value={item.icon || 'sparkles'}
                      onValueChange={(value) => updateItem(item.id, { icon: value })}
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
                      onValueChange={(value) => updateItem(item.id, { gradient: value })}
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
                    onChange={(e) => updateItem(item.id, { image_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </CardContent>
            )}
          </Card>
        ))}

        {items.length === 0 && (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
            <p>No items yet. Click "Add Item" to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BentoItemEditor;
