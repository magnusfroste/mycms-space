// ============================================
// Project Category Select
// Multi-select for assigning categories to a project
// ============================================

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tag, ChevronDown } from 'lucide-react';
import { useCategories, useProjectCategories, useUpdateProjectCategories } from '@/models/categories';
import { useToast } from '@/hooks/use-toast';

interface ProjectCategorySelectProps {
  projectId: string;
  compact?: boolean;
}

const ProjectCategorySelect: React.FC<ProjectCategorySelectProps> = ({
  projectId,
  compact = false,
}) => {
  const { toast } = useToast();
  const { data: allCategories, isLoading: categoriesLoading } = useCategories();
  const { data: projectCategories, isLoading: projectCategoriesLoading } = useProjectCategories(projectId);
  const updateProjectCategories = useUpdateProjectCategories();

  const selectedIds = projectCategories?.map((c) => c.id) || [];

  const handleToggleCategory = async (categoryId: string, checked: boolean) => {
    const newIds = checked
      ? [...selectedIds, categoryId]
      : selectedIds.filter((id) => id !== categoryId);

    try {
      await updateProjectCategories.mutateAsync({
        projectId,
        categoryIds: newIds,
      });
    } catch (error) {
      toast({ title: 'Kunde inte uppdatera kategorier', variant: 'destructive' });
    }
  };

  if (categoriesLoading || projectCategoriesLoading) {
    return <Skeleton className="h-6 w-24" />;
  }

  if (compact) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 px-2 gap-1 text-xs">
            <Tag className="h-3 w-3" />
            {selectedIds.length > 0 ? (
              <span>{selectedIds.length} kat.</span>
            ) : (
              <span className="text-muted-foreground">Kategorier</span>
            )}
            <ChevronDown className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2 bg-popover" align="start">
          <div className="space-y-1">
            {allCategories?.map((category) => (
              <label
                key={category.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer"
              >
                <Checkbox
                  checked={selectedIds.includes(category.id)}
                  onCheckedChange={(checked) =>
                    handleToggleCategory(category.id, checked === true)
                  }
                />
                <span className="text-sm">{category.name}</span>
              </label>
            ))}
            {(!allCategories || allCategories.length === 0) && (
              <p className="text-xs text-muted-foreground px-2 py-1">
                Inga kategorier skapade
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs">Kategorier</Label>
      <div className="flex flex-wrap gap-1.5">
        {allCategories?.map((category) => {
          const isSelected = selectedIds.includes(category.id);
          return (
            <Badge
              key={category.id}
              variant={isSelected ? 'default' : 'outline'}
              className="cursor-pointer transition-colors"
              onClick={() => handleToggleCategory(category.id, !isSelected)}
            >
              {category.name}
            </Badge>
          );
        })}
        {(!allCategories || allCategories.length === 0) && (
          <span className="text-xs text-muted-foreground">
            Inga kategorier. Skapa i Portfolio-inställningar.
          </span>
        )}
      </div>
    </div>
  );
};

export default ProjectCategorySelect;
