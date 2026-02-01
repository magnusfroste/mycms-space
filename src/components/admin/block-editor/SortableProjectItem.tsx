// ============================================
// Sortable Project Item
// Draggable project card for reordering
// ============================================

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Pencil,
  Trash2,
  GripVertical,
  ExternalLink,
  Image as ImageIcon,
} from 'lucide-react';
import type { Project } from '@/types';
import ProjectCategorySelectInline from './ProjectCategorySelectInline';

interface Category {
  id: string;
  name: string;
  slug: string;
  order_index: number;
  enabled: boolean;
}

interface SortableProjectItemProps {
  project: Project;
  allCategories?: Category[];
  selectedCategorySlugs?: string[];
  onEdit: (project: Project) => void;
  onToggle: (id: string, enabled: boolean) => void;
  onDelete: (id: string) => void;
  onCategoryChange?: (projectId: string, slugs: string[]) => void;
}

const SortableProjectItem: React.FC<SortableProjectItemProps> = ({
  project,
  allCategories = [],
  selectedCategorySlugs = [],
  onEdit,
  onToggle,
  onDelete,
  onCategoryChange,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`p-3 ${isDragging ? 'opacity-50 shadow-lg ring-2 ring-primary' : ''}`}
    >
      <div className="flex items-start gap-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded touch-none"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0" />
        </button>

        {/* Thumbnail */}
        <div className="w-16 h-12 rounded bg-muted shrink-0 overflow-hidden">
          {project.images && project.images.length > 0 ? (
            <img
              src={project.images[0].image_url}
              alt={project.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="h-4 w-4 text-muted-foreground/50" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{project.title}</div>
          <div className="text-xs text-muted-foreground line-clamp-2">
            {project.description}
          </div>
          <div className="flex items-center gap-2 mt-1">
            {project.demo_link && project.demo_link !== '#' && (
              <a
                href={project.demo_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Demo
              </a>
            )}
            {project.images && project.images.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {project.images.length} image{project.images.length !== 1 ? 's' : ''}
              </span>
            )}
            {allCategories.length > 0 && onCategoryChange && (
              <ProjectCategorySelectInline
                allCategories={allCategories}
                selectedSlugs={selectedCategorySlugs}
                onSelectionChange={(slugs) => onCategoryChange(project.id, slugs)}
                compact
              />
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(project)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Switch
            checked={project.enabled}
            onCheckedChange={(checked) => onToggle(project.id, checked)}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(project.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default SortableProjectItem;
