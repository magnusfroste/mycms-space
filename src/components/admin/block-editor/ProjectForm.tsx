// ============================================
// Project Form
// Reusable form for create/edit project
// ============================================

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, X, Plus } from 'lucide-react';
import { AITextActions } from '@/components/common';
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
          <div className="flex items-center justify-between">
            <Label className="text-xs">Description *</Label>
            <AITextActions
              text={data.description}
              onTextChange={(text) => onChange({ ...data, description: text })}
              context="project description"
              mode="text"
            />
          </div>
          <Textarea
            value={data.description}
            onChange={(e) => onChange({ ...data, description: e.target.value })}
            placeholder="Short description..."
            rows={4}
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
          <div className="flex items-center justify-between">
            <Label className="text-xs">Problem Statement</Label>
            <AITextActions
              text={data.problem_statement}
              onTextChange={(text) => onChange({ ...data, problem_statement: text })}
              context="problem statement"
              mode="text"
            />
          </div>
          <Textarea
            value={data.problem_statement}
            onChange={(e) => onChange({ ...data, problem_statement: e.target.value })}
            placeholder="What problem does this project solve?"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Why was it built?</Label>
            <AITextActions
              text={data.why_built}
              onTextChange={(text) => onChange({ ...data, why_built: text })}
              context="project motivation"
              mode="text"
            />
          </div>
          <Textarea
            value={data.why_built}
            onChange={(e) => onChange({ ...data, why_built: e.target.value })}
            placeholder="Motivation and goals..."
            rows={3}
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
