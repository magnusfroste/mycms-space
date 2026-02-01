// ============================================
// Project Category Select (Inline/JSONB version)
// Multi-select for assigning categories to a project
// Works with block_config JSONB data instead of database tables
// ============================================

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tag, ChevronDown } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  order_index: number;
  enabled: boolean;
}

interface ProjectCategorySelectInlineProps {
  /** All available categories from block config */
  allCategories: Category[];
  /** Currently selected category slugs for this project */
  selectedSlugs: string[];
  /** Called when selection changes */
  onSelectionChange: (slugs: string[]) => void;
  /** Compact mode shows a small button with popover */
  compact?: boolean;
}

const ProjectCategorySelectInline: React.FC<ProjectCategorySelectInlineProps> = ({
  allCategories,
  selectedSlugs,
  onSelectionChange,
  compact = false,
}) => {
  const enabledCategories = allCategories.filter((c) => c.enabled);

  const handleToggleCategory = (slug: string, checked: boolean) => {
    const newSlugs = checked
      ? [...selectedSlugs, slug]
      : selectedSlugs.filter((s) => s !== slug);
    onSelectionChange(newSlugs);
  };

  if (compact) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 px-2 gap-1 text-xs">
            <Tag className="h-3 w-3" />
            {selectedSlugs.length > 0 ? (
              <span>{selectedSlugs.length} cat.</span>
            ) : (
              <span className="text-muted-foreground">Categories</span>
            )}
            <ChevronDown className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2 bg-popover" align="start">
          <div className="space-y-1">
            {enabledCategories.map((category) => (
              <label
                key={category.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer"
              >
                <Checkbox
                  checked={selectedSlugs.includes(category.slug)}
                  onCheckedChange={(checked) =>
                    handleToggleCategory(category.slug, checked === true)
                  }
                />
                <span className="text-sm">{category.name}</span>
              </label>
            ))}
            {enabledCategories.length === 0 && (
              <p className="text-xs text-muted-foreground px-2 py-1">
                No categories created
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs">Categories</Label>
      <div className="flex flex-wrap gap-1.5">
        {enabledCategories.map((category) => {
          const isSelected = selectedSlugs.includes(category.slug);
          return (
            <Badge
              key={category.id}
              variant={isSelected ? 'default' : 'outline'}
              className="cursor-pointer transition-colors"
              onClick={() => handleToggleCategory(category.slug, !isSelected)}
            >
              {category.name}
            </Badge>
          );
        })}
        {enabledCategories.length === 0 && (
          <span className="text-xs text-muted-foreground">
            No categories. Create in Project Showcase settings.
          </span>
        )}
      </div>
    </div>
  );
};

export default ProjectCategorySelectInline;
