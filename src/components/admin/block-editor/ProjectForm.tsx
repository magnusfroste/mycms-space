// ============================================
// Project Form
// Reusable form for create/edit project
// ============================================

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, X, Plus } from 'lucide-react';
import { RichTextEditor } from '@/components/common';
import ProjectImageGallery from './ProjectImageGallery';
import ProjectCategorySelectInline from './ProjectCategorySelectInline';
import type { ProjectImage } from '@/types';

interface ProjectFormData {
  title: string;
  description: string;
  demo_link: string;
  problem_statement: string;
  why_built: string;
}

interface ProjectFormProps {
  data: ProjectFormData;
  onChange: (data: ProjectFormData) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving?: boolean;
  isCreate?: boolean;
  projectId?: string;
  images?: ProjectImage[];
  onDeleteImage?: (image: ProjectImage) => void;
  onUploadImage?: () => void;
  isUploading?: boolean;
  // For inline category selection (new JSONB mode)
  categories?: Array<{ id: string; name: string; slug: string }>;
  selectedCategories?: string[];
  onCategoryChange?: (slugs: string[]) => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({
  data,
  onChange,
  onSave,
  onCancel,
  isSaving,
  isCreate,
  projectId,
  images,
  onDeleteImage,
  onUploadImage,
  isUploading,
  categories,
  selectedCategories,
  onCategoryChange,
}) => {
  return (
    <Card className={`p-4 ${isCreate ? 'border-primary/50 bg-primary/5' : ''}`}>
      <div className="space-y-3">
        {isCreate && (
          <div className="flex items-center gap-2 mb-2">
            <Plus className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Create New Project</span>
          </div>
        )}

        {/* Image gallery - only for edit mode */}
        {!isCreate && images && onDeleteImage && onUploadImage && (
          <ProjectImageGallery
            images={images}
            onDeleteImage={onDeleteImage}
            onUploadImage={onUploadImage}
            isUploading={isUploading}
          />
        )}

        <div className="space-y-2">
          <Label className="text-xs">Title *</Label>
          <Input
            value={data.title}
            onChange={(e) => onChange({ ...data, title: e.target.value })}
            placeholder="Project name..."
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Description *</Label>
          <RichTextEditor
            value={data.description}
            onChange={(text) => onChange({ ...data, description: text })}
            title={data.title}
            placeholder="Short description..."
            minHeight="min-h-[120px]"
            showAI
            aiMode="text"
            aiContext="project description"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Demo Link</Label>
          <Input
            value={data.demo_link}
            onChange={(e) => onChange({ ...data, demo_link: e.target.value })}
            placeholder="https://..."
            type="url"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Problem Statement</Label>
          <RichTextEditor
            value={data.problem_statement}
            onChange={(text) => onChange({ ...data, problem_statement: text })}
            title={data.title}
            placeholder="What problem does this project solve?"
            minHeight="min-h-[100px]"
            showAI
            aiMode="text"
            aiContext="problem statement"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Why was it built?</Label>
          <RichTextEditor
            value={data.why_built}
            onChange={(text) => onChange({ ...data, why_built: text })}
            title={data.title}
            placeholder="Motivation and goals..."
            minHeight="min-h-[100px]"
            showAI
            aiMode="text"
            aiContext="project motivation"
          />
        </div>

        {/* Category Selection - uses inline categories from block_config */}
        {categories && categories.length > 0 && onCategoryChange && (
          <ProjectCategorySelectInline
            allCategories={categories.map((c, i) => ({ ...c, order_index: i, enabled: true }))}
            selectedSlugs={selectedCategories || []}
            onSelectionChange={onCategoryChange}
          />
        )}

        <div className="flex gap-2 pt-2">
          <Button onClick={onSave} size="sm" disabled={isSaving}>
            <Check className="h-4 w-4 mr-1" />
            {isCreate ? 'Create' : 'Save'}
          </Button>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ProjectForm;
