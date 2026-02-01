// ============================================
// Image Upload Component
// Reusable image upload with preview for block editor
// ============================================

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { compressImage } from '@/lib/utils/imageCompression';

interface ImageUploadProps {
  label?: string;
  value?: string;
  currentImageUrl?: string;
  onChange?: (url: string) => void;
  onImageChange?: (url: string, path?: string) => void;
  bucket: 'about-me-images' | 'featured-images' | 'project-images' | 'blog-images';
  folder?: string;
  className?: string;
  aspectRatio?: string;
  compact?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  label,
  value,
  currentImageUrl,
  onChange,
  onImageChange,
  bucket,
  folder = '',
  className,
  aspectRatio,
  compact,
}) => {
  // Support both value and currentImageUrl props
  const imageUrl = value || currentImageUrl || '';
  const handleChange = (url: string, path?: string) => {
    onChange?.(url);
    onImageChange?.(url, path);
  };
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setError('Only JPG, PNG, WEBP or GIF allowed');
      return;
    }

    // Validate file size (max 10MB before compression)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be max 10MB');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Compress the image
      const compressedFile = await compressImage(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
      });

      // Generate unique filename
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `${folder ? `${folder}/` : ''}editor-${Date.now()}.${fileExt}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, compressedFile, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      handleChange(publicUrl, fileName);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Could not upload image');
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClear = () => {
    handleChange('', '');
    setError(null);
  };

  const aspectStyle = aspectRatio ? { aspectRatio } : {};

  return (
    <div className={cn('space-y-2', className)}>
      {label && <Label>{label}</Label>}
      
      {/* Preview */}
      {imageUrl ? (
        <div className="relative rounded-lg overflow-hidden border bg-muted" style={aspectStyle}>
          <img
            src={imageUrl}
            alt="Preview"
            className={cn("w-full object-cover", compact ? "h-24" : "h-32")}
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
          <Button
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2 h-7 w-7 p-0"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-6',
            'flex flex-col items-center justify-center gap-2',
            'text-muted-foreground',
            'hover:border-primary/50 hover:bg-muted/50 transition-colors',
            'cursor-pointer'
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-sm">Uploading...</span>
            </>
          ) : (
            <>
              <ImageIcon className="h-8 w-8" />
              <span className="text-sm">Click to upload image</span>
              <span className="text-xs">JPG, PNG, WEBP (max 10MB)</span>
            </>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
        disabled={isUploading}
      />

      {/* Upload button when image exists */}
      {imageUrl && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Change image
            </>
          )}
        </Button>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};

export default ImageUpload;
