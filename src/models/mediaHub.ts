// ============================================
// Media Hub Model Layer
// React Query hooks for media management
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  listAllMediaFiles, 
  listBucketFiles,
  deleteMediaFile, 
  renameMediaFile,
  moveMediaFile,
  type StorageBucket,
  type MediaFile,
} from '@/data/mediaHub';
import { toast } from 'sonner';

const MEDIA_QUERY_KEY = ['media-files'];

// Hook to fetch all media files
export function useMediaFiles() {
  return useQuery({
    queryKey: MEDIA_QUERY_KEY,
    queryFn: listAllMediaFiles,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Hook to fetch files from a specific bucket
export function useBucketFiles(bucket: StorageBucket | null) {
  return useQuery({
    queryKey: [...MEDIA_QUERY_KEY, bucket],
    queryFn: () => bucket ? listBucketFiles(bucket) : listAllMediaFiles(),
    staleTime: 2 * 60 * 1000,
  });
}

// Hook to delete a media file
export function useDeleteMediaFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bucket, path }: { bucket: StorageBucket; path: string }) =>
      deleteMediaFile(bucket, path),
    onSuccess: (success) => {
      if (success) {
        toast.success('File deleted');
        queryClient.invalidateQueries({ queryKey: MEDIA_QUERY_KEY });
      } else {
        toast.error('Failed to delete file');
      }
    },
    onError: () => {
      toast.error('Failed to delete file');
    },
  });
}

// Hook to rename a media file
export function useRenameMediaFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bucket, oldPath, newName }: { 
      bucket: StorageBucket; 
      oldPath: string; 
      newName: string;
    }) => renameMediaFile(bucket, oldPath, newName),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('File renamed');
        queryClient.invalidateQueries({ queryKey: MEDIA_QUERY_KEY });
      } else {
        toast.error('Failed to rename file');
      }
    },
    onError: () => {
      toast.error('Failed to rename file');
    },
  });
}

// Hook to move file between buckets
export function useMoveMediaFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sourceBucket, sourcePath, targetBucket }: {
      sourceBucket: StorageBucket;
      sourcePath: string;
      targetBucket: StorageBucket;
    }) => moveMediaFile(sourceBucket, sourcePath, targetBucket),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('File moved');
        queryClient.invalidateQueries({ queryKey: MEDIA_QUERY_KEY });
      } else {
        toast.error('Failed to move file');
      }
    },
    onError: () => {
      toast.error('Failed to move file');
    },
  });
}

// Re-export types
export type { StorageBucket, MediaFile };
export { STORAGE_BUCKETS, BUCKET_LABELS } from '@/data/mediaHub';
