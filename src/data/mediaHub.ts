// ============================================
// Media Hub Data Layer
// Fetches files from all storage buckets
// ============================================

import { supabase } from '@/integrations/supabase/client';

export type StorageBucket = 'about-me-images' | 'featured-images' | 'project-images' | 'blog-images';

export const STORAGE_BUCKETS: StorageBucket[] = [
  'about-me-images',
  'featured-images', 
  'project-images',
  'blog-images',
];

export const BUCKET_LABELS: Record<StorageBucket, string> = {
  'about-me-images': 'About Me',
  'featured-images': 'Featured',
  'project-images': 'Projects',
  'blog-images': 'Blog',
};

export interface MediaFile {
  id: string;
  name: string;
  bucket: StorageBucket;
  path: string;
  publicUrl: string;
  size: number;
  createdAt: string;
  mimeType: string | null;
}

// List files from a specific bucket
export async function listBucketFiles(bucket: StorageBucket): Promise<MediaFile[]> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list('', {
      limit: 500,
      sortBy: { column: 'created_at', order: 'desc' },
    });

  if (error) {
    console.error(`Error listing files from ${bucket}:`, error);
    return [];
  }

  // Filter out folders (items without metadata)
  const files = (data || []).filter(file => file.id && file.name);

  return files.map(file => {
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(file.name);
    return {
      id: file.id,
      name: file.name,
      bucket,
      path: file.name,
      publicUrl,
      size: file.metadata?.size || 0,
      createdAt: file.created_at || '',
      mimeType: file.metadata?.mimetype || null,
    };
  });
}

// List files from all buckets
export async function listAllMediaFiles(): Promise<MediaFile[]> {
  const results = await Promise.all(
    STORAGE_BUCKETS.map(bucket => listBucketFiles(bucket))
  );
  
  return results.flat().sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// Delete a file from storage
export async function deleteMediaFile(bucket: StorageBucket, path: string): Promise<boolean> {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    console.error('Error deleting file:', error);
    return false;
  }
  return true;
}

// Rename a file (copy to new name, delete old)
export async function renameMediaFile(
  bucket: StorageBucket, 
  oldPath: string, 
  newName: string
): Promise<{ success: boolean; newUrl?: string }> {
  // Download the file
  const { data: fileData, error: downloadError } = await supabase.storage
    .from(bucket)
    .download(oldPath);

  if (downloadError || !fileData) {
    console.error('Error downloading file for rename:', downloadError);
    return { success: false };
  }

  // Get file extension from old path
  const oldExt = oldPath.split('.').pop();
  const newExt = newName.includes('.') ? '' : `.${oldExt}`;
  const newPath = `${newName}${newExt}`;

  // Upload with new name
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(newPath, fileData, { upsert: true });

  if (uploadError) {
    console.error('Error uploading renamed file:', uploadError);
    return { success: false };
  }

  // Delete old file
  await supabase.storage.from(bucket).remove([oldPath]);

  // Get new public URL
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(newPath);

  return { success: true, newUrl: publicUrl };
}

// Move file to different bucket
export async function moveMediaFile(
  sourceBucket: StorageBucket,
  sourcePath: string,
  targetBucket: StorageBucket
): Promise<{ success: boolean; newUrl?: string }> {
  // Download the file
  const { data: fileData, error: downloadError } = await supabase.storage
    .from(sourceBucket)
    .download(sourcePath);

  if (downloadError || !fileData) {
    console.error('Error downloading file for move:', downloadError);
    return { success: false };
  }

  // Upload to target bucket
  const { error: uploadError } = await supabase.storage
    .from(targetBucket)
    .upload(sourcePath, fileData, { upsert: true });

  if (uploadError) {
    console.error('Error uploading to target bucket:', uploadError);
    return { success: false };
  }

  // Delete from source bucket
  await supabase.storage.from(sourceBucket).remove([sourcePath]);

  // Get new public URL
  const { data: { publicUrl } } = supabase.storage.from(targetBucket).getPublicUrl(sourcePath);

  return { success: true, newUrl: publicUrl };
}
