// ============================================
// Project Image Gallery
// Image gallery with upload and delete
// ============================================

import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X, Plus, Loader2 } from 'lucide-react';
import type { ProjectImage } from '@/types';

interface ProjectImageGalleryProps {
  images: ProjectImage[];
  onDeleteImage: (image: ProjectImage) => void;
  onUploadImage: () => void;
  isUploading?: boolean;
}

const ProjectImageGallery: React.FC<ProjectImageGalleryProps> = ({
  images,
  onDeleteImage,
  onUploadImage,
  isUploading,
}) => {
  return (
    <div className="space-y-2">
      <Label className="text-xs">Images</Label>
      <div className="flex flex-wrap gap-2">
        {images.map((img) => (
          <div key={img.id} className="relative group">
            <img
              src={img.image_url}
              alt=""
              className="w-20 h-14 object-cover rounded border"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute -top-1 -right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onDeleteImage(img)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          className="w-20 h-14 flex flex-col gap-1"
          onClick={onUploadImage}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span className="text-[10px]">Add</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ProjectImageGallery;
