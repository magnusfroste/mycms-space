// ============================================
// Media Hub Data Layer
// Fetches files from all storage buckets
// ============================================

import { supabase } from '@/integrations/supabase/client';

export type StorageBucket = 'about-me-images' | 'featured-images' | 'project-images' | 'blog-images' | 'cms-files' | 'agent-documents';

export const STORAGE_BUCKETS: StorageBucket[] = [
  'about-me-images',
  'featured-images', 
  'project-images',
  'blog-images',
  'cms-files',
  'agent-documents',
];

export const BUCKET_LABELS: Record<StorageBucket, string> = {
  'about-me-images': 'About Me',
  'featured-images': 'Featured',
  'project-images': 'Projects',
  'blog-images': 'Blog',
  'cms-files': 'Files',
  'agent-documents': 'Agent Docs',
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

type StorageEntry = NonNullable<
  Awaited<ReturnType<ReturnType<typeof supabase.storage.from>['list']>>['data']
>[number];

/**
 * List every file in a bucket. Storage lists one folder level per call and
 * real uploads live in folders (blog-images/covers/, project-images/<repo-id>/),
 * so descend into folders (entries without an id) a few levels deep.
 */
export async function listStorageEntries(
  bucket: string,
  prefix = '',
  depth = 0,
): Promise<{ path: string; entry: StorageEntry }[]> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(prefix, {
      limit: 1000,
      sortBy: { column: 'created_at', order: 'desc' },
    });

  if (error) {
    console.error(`Error listing files from ${bucket}/${prefix}:`, error);
    return [];
  }

  const entries = (data || []).filter((e) => e.name && e.name !== '.emptyFolderPlaceholder');
  const files = entries
    .filter((e) => e.id)
    .map((entry) => ({ path: prefix ? `${prefix}/${entry.name}` : entry.name, entry }));
  if (depth >= 3) return files;

  const folders = entries.filter((e) => !e.id);
  const nested = await Promise.all(
    folders.map((f) => listStorageEntries(bucket, prefix ? `${prefix}/${f.name}` : f.name, depth + 1)),
  );
  return [...files, ...nested.flat()];
}

// List files from a specific bucket
export async function listBucketFiles(bucket: StorageBucket): Promise<MediaFile[]> {
  const files = await listStorageEntries(bucket);

  return files.map(({ path, entry: file }) => {
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
    return {
      id: file.id as string,
      name: file.name,
      bucket,
      path,
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
  // Keep the file in its folder (e.g. covers/)
  const dir = oldPath.includes('/') ? oldPath.slice(0, oldPath.lastIndexOf('/') + 1) : '';
  const newPath = `${dir}${newName}${newExt}`;

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
