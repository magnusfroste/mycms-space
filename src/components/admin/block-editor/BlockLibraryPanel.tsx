// ============================================
// Block Library Panel
// Categorized block picker for the page builder
// ============================================

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import {
  Search,
  ChevronDown,
  Sparkles,
  Layout,
  Type,
  Image,
  Users,
  Grid3X3,
  Play,
  MessageCircle,
  BarChart3,
  Layers,
  ArrowRight,
  Plus,
} from 'lucide-react';

// Block categories with their blocks
const BLOCK_CATEGORIES = [
  {
    id: 'hero',
    name: 'Hero & Headers',
    icon: Sparkles,
    blocks: [
      { type: 'hero', name: 'Hero', description: 'Huvudsektion med namn och features', icon: Sparkles },
      { type: 'video-hero', name: 'Video Hero', description: 'Fullskärmsvideo med overlay-text', icon: Play },
      { type: 'parallax-section', name: 'Parallax', description: 'Flerlagers scroll-effekt', icon: Layers },
    ],
  },
  {
    id: 'content',
    name: 'Innehåll',
    icon: Type,
    blocks: [
      { type: 'text-section', name: 'Text Section', description: 'Enkel textblock', icon: Type },
      { type: 'image-text', name: 'Bild & Text', description: 'Bild med tillhörande text', icon: Image },
      { type: 'about-split', name: 'Om Mig', description: 'Split-layout med bild och skills', icon: Users },
    ],
  },
  {
    id: 'features',
    name: 'Features & Grid',
    icon: Grid3X3,
    blocks: [
      { type: 'bento-grid', name: 'Bento Grid', description: 'Modern asymmetrisk layout', icon: Grid3X3 },
      { type: 'expertise-grid', name: 'Expertise Grid', description: 'Grid med kompetensområden', icon: Layout },
      { type: 'stats-counter', name: 'Stats Counter', description: 'Animerade siffror', icon: BarChart3 },
    ],
  },
  {
    id: 'social',
    name: 'Social Proof',
    icon: Users,
    blocks: [
      { type: 'testimonial-carousel', name: 'Testimonials', description: '3D-karusell med kundcitat', icon: Users },
      { type: 'featured-carousel', name: 'Featured', description: 'Karusell med logotyper', icon: Image },
      { type: 'marquee', name: 'Marquee', description: 'Rullande text/logotyper', icon: ArrowRight },
    ],
  },
  {
    id: 'showcase',
    name: 'Projekt & Portfolio',
    icon: Layout,
    blocks: [
      { type: 'project-showcase', name: 'Projekt Showcase', description: 'Portfolio med filtrering', icon: Layout },
    ],
  },
  {
    id: 'cta',
    name: 'CTA & Kontakt',
    icon: MessageCircle,
    blocks: [
      { type: 'cta-banner', name: 'CTA Banner', description: 'Call-to-action med knapp', icon: ArrowRight },
      { type: 'chat-widget', name: 'Chat Widget', description: 'AI-chat för besökare', icon: MessageCircle },
    ],
  },
  {
    id: 'utility',
    name: 'Utility',
    icon: Layers,
    blocks: [
      { type: 'spacer', name: 'Spacer', description: 'Vertikal mellanrum', icon: Layers },
    ],
  },
];

interface BlockLibraryPanelProps {
  onAddBlock: (blockType: string) => void;
  isAdding?: boolean;
  onClose?: () => void;
}

const BlockLibraryPanel = ({ onAddBlock, isAdding, onClose }: BlockLibraryPanelProps) => {
  const [search, setSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['hero', 'features', 'social']);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Filter blocks based on search
  const filteredCategories = BLOCK_CATEGORIES.map(category => ({
    ...category,
    blocks: category.blocks.filter(
      block =>
        block.name.toLowerCase().includes(search.toLowerCase()) ||
        block.description.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(category => category.blocks.length > 0);

  return (
    <div className="h-full flex flex-col bg-background border-l border-border">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm">Blockbibliotek</h3>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
              ×
            </Button>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Sök block..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {/* Block List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredCategories.map((category) => (
            <Collapsible
              key={category.id}
              open={expandedCategories.includes(category.id) || search.length > 0}
              onOpenChange={() => toggleCategory(category.id)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between h-8 px-2 text-xs font-medium"
                >
                  <div className="flex items-center gap-2">
                    <category.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{category.name}</span>
                    <span className="text-muted-foreground">({category.blocks.length})</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 text-muted-foreground transition-transform",
                      expandedCategories.includes(category.id) && "rotate-180"
                    )}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="pl-2 pr-1 py-1 space-y-1">
                  {category.blocks.map((block) => (
                    <button
                      key={block.type}
                      onClick={() => onAddBlock(block.type)}
                      disabled={isAdding}
                      className={cn(
                        "w-full text-left p-2 rounded-md border border-transparent",
                        "hover:bg-accent hover:border-border",
                        "transition-colors group",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <div className="w-7 h-7 rounded bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                          <block.icon className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium truncate">{block.name}</span>
                            <Plus className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {block.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </ScrollArea>

      {/* Footer hint */}
      <div className="p-2 border-t border-border">
        <p className="text-[10px] text-muted-foreground text-center">
          Klicka för att lägga till block
        </p>
      </div>
    </div>
  );
};

export default BlockLibraryPanel;
