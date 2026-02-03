// ============================================
// Media Hub Admin Component
// Centralized media library for browsing and managing all uploaded files
// ============================================

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Image as ImageIcon,
  Search,
  Trash2,
  Edit3,
  MoreVertical,
  Copy,
  ExternalLink,
  FolderOpen,
  Calendar,
  HardDrive,
  RefreshCw,
  Grid,
  List,
  Check,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  useMediaFiles,
  useDeleteMediaFile,
  useRenameMediaFile,
  useMoveMediaFile,
  STORAGE_BUCKETS,
  BUCKET_LABELS,
  type StorageBucket,
  type MediaFile,
} from '@/models/mediaHub';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

type ViewMode = 'grid' | 'list';
type SortBy = 'date' | 'name' | 'size';

const MediaHub: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: files = [], isLoading, refetch } = useMediaFiles();
  const deleteFile = useDeleteMediaFile();
  const renameFile = useRenameMediaFile();
  const moveFile = useMoveMediaFile();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBucket, setSelectedBucket] = useState<StorageBucket | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [targetBucket, setTargetBucket] = useState<StorageBucket | ''>('');

  // Filter and sort files
  const filteredFiles = useMemo(() => {
    let result = [...files];

    // Filter by bucket
    if (selectedBucket !== 'all') {
      result = result.filter(f => f.bucket === selectedBucket);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(f => f.name.toLowerCase().includes(query));
    }

    // Sort
    switch (sortBy) {
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'size':
        result.sort((a, b) => b.size - a.size);
        break;
      case 'date':
      default:
        result.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }

    return result;
  }, [files, selectedBucket, searchQuery, sortBy]);

  // Stats
  const stats = useMemo(() => {
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    const bucketCounts = STORAGE_BUCKETS.reduce((acc, bucket) => {
      acc[bucket] = files.filter(f => f.bucket === bucket).length;
      return acc;
    }, {} as Record<StorageBucket, number>);
    return { totalFiles: files.length, totalSize, bucketCounts };
  }, [files]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard');
  };

  const handleRename = async () => {
    if (!selectedFile || !newFileName.trim()) return;
    await renameFile.mutateAsync({
      bucket: selectedFile.bucket,
      oldPath: selectedFile.path,
      newName: newFileName.trim(),
    });
    setRenameDialogOpen(false);
    setSelectedFile(null);
    setNewFileName('');
  };

  const handleDelete = async () => {
    if (!selectedFile) return;
    await deleteFile.mutateAsync({
      bucket: selectedFile.bucket,
      path: selectedFile.path,
    });
    setDeleteDialogOpen(false);
    setSelectedFile(null);
  };

  const handleMove = async () => {
    if (!selectedFile || !targetBucket) return;
    await moveFile.mutateAsync({
      sourceBucket: selectedFile.bucket,
      sourcePath: selectedFile.path,
      targetBucket: targetBucket as StorageBucket,
    });
    setMoveDialogOpen(false);
    setSelectedFile(null);
    setTargetBucket('');
  };

  const openRenameDialog = (file: MediaFile) => {
    setSelectedFile(file);
    setNewFileName(file.name.replace(/\.[^/.]+$/, '')); // Remove extension
    setRenameDialogOpen(true);
  };

  const openDeleteDialog = (file: MediaFile) => {
    setSelectedFile(file);
    setDeleteDialogOpen(true);
  };

  const openMoveDialog = (file: MediaFile) => {
    setSelectedFile(file);
    setTargetBucket('');
    setMoveDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Media Hub</h2>
          <p className="text-muted-foreground">
            Manage all uploaded images across your site
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <ImageIcon className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stats.totalFiles}</p>
              <p className="text-xs text-muted-foreground">Total files</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <HardDrive className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</p>
              <p className="text-xs text-muted-foreground">Total size</p>
            </div>
          </CardContent>
        </Card>
        {STORAGE_BUCKETS.slice(0, 3).map(bucket => (
          <Card key={bucket}>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{stats.bucketCounts[bucket]}</p>
              <p className="text-xs text-muted-foreground">{BUCKET_LABELS[bucket]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Bucket filter */}
            <Select
              value={selectedBucket}
              onValueChange={(v) => setSelectedBucket(v as StorageBucket | 'all')}
            >
              <SelectTrigger className="w-[180px]">
                <FolderOpen className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All buckets" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All buckets</SelectItem>
                {STORAGE_BUCKETS.map(bucket => (
                  <SelectItem key={bucket} value={bucket}>
                    {BUCKET_LABELS[bucket]} ({stats.bucketCounts[bucket]})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select
              value={sortBy}
              onValueChange={(v) => setSortBy(v as SortBy)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">
                  <Calendar className="h-4 w-4 mr-2 inline" />
                  Date
                </SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="size">Size</SelectItem>
              </SelectContent>
            </Select>

            {/* View mode */}
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                className="rounded-r-none"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                className="rounded-l-none"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Grid/List */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      ) : filteredFiles.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No media files found</p>
            {searchQuery && (
              <Button 
                variant="link" 
                onClick={() => setSearchQuery('')}
                className="mt-2"
              >
                Clear search
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredFiles.map(file => (
            <MediaFileCard
              key={file.id}
              file={file}
              onCopy={() => copyToClipboard(file.publicUrl)}
              onRename={() => openRenameDialog(file)}
              onMove={() => openMoveDialog(file)}
              onDelete={() => openDeleteDialog(file)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredFiles.map(file => (
                <MediaFileRow
                  key={file.id}
                  file={file}
                  formatSize={formatFileSize}
                  onCopy={() => copyToClipboard(file.publicUrl)}
                  onRename={() => openRenameDialog(file)}
                  onMove={() => openMoveDialog(file)}
                  onDelete={() => openDeleteDialog(file)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename file</DialogTitle>
            <DialogDescription>
              Enter a new name for this file. The extension will be preserved.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            placeholder="New file name"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleRename}
              disabled={!newFileName.trim() || renameFile.isPending}
            >
              {renameFile.isPending ? 'Renaming...' : 'Rename'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete file</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedFile?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedFile && (
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <img
                src={selectedFile.publicUrl}
                alt={selectedFile.name}
                className="w-16 h-16 object-cover rounded"
              />
              <div className="text-sm">
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-muted-foreground">
                  {BUCKET_LABELS[selectedFile.bucket]}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteFile.isPending}
            >
              {deleteFile.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Dialog */}
      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move file</DialogTitle>
            <DialogDescription>
              Move "{selectedFile?.name}" to a different bucket.
            </DialogDescription>
          </DialogHeader>
          <Select
            value={targetBucket}
            onValueChange={(v) => setTargetBucket(v as StorageBucket)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select target bucket" />
            </SelectTrigger>
            <SelectContent>
              {STORAGE_BUCKETS.filter(b => b !== selectedFile?.bucket).map(bucket => (
                <SelectItem key={bucket} value={bucket}>
                  {BUCKET_LABELS[bucket]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleMove}
              disabled={!targetBucket || moveFile.isPending}
            >
              {moveFile.isPending ? 'Moving...' : 'Move'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Grid card component
interface MediaFileCardProps {
  file: MediaFile;
  onCopy: () => void;
  onRename: () => void;
  onMove: () => void;
  onDelete: () => void;
}

const MediaFileCard: React.FC<MediaFileCardProps> = ({
  file,
  onCopy,
  onRename,
  onMove,
  onDelete,
}) => {
  return (
    <div className="group relative">
      <div className="aspect-square rounded-lg overflow-hidden border bg-muted">
        <img
          src={file.publicUrl}
          alt={file.name}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
          loading="lazy"
        />
      </div>
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col justify-between p-2">
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onCopy}>
                <Copy className="h-4 w-4 mr-2" />
                Copy URL
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open(file.publicUrl, '_blank')}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in new tab
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onRename}>
                <Edit3 className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onMove}>
                <FolderOpen className="h-4 w-4 mr-2" />
                Move to bucket
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="text-white text-xs truncate px-1">
          {file.name}
        </div>
      </div>

      {/* Bucket badge */}
      <Badge 
        variant="secondary" 
        className="absolute top-2 left-2 text-xs opacity-80"
      >
        {BUCKET_LABELS[file.bucket]}
      </Badge>
    </div>
  );
};

// List row component
interface MediaFileRowProps {
  file: MediaFile;
  formatSize: (bytes: number) => string;
  onCopy: () => void;
  onRename: () => void;
  onMove: () => void;
  onDelete: () => void;
}

const MediaFileRow: React.FC<MediaFileRowProps> = ({
  file,
  formatSize,
  onCopy,
  onRename,
  onMove,
  onDelete,
}) => {
  return (
    <div className="flex items-center gap-4 p-3 hover:bg-muted/50">
      <img
        src={file.publicUrl}
        alt={file.name}
        className="w-12 h-12 object-cover rounded"
        loading="lazy"
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{file.name}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-xs">
            {BUCKET_LABELS[file.bucket]}
          </Badge>
          <span>{formatSize(file.size)}</span>
          {file.createdAt && (
            <span>{format(new Date(file.createdAt), 'MMM d, yyyy')}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={onCopy}>
          <Copy className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => window.open(file.publicUrl, '_blank')}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in new tab
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onRename}>
              <Edit3 className="h-4 w-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onMove}>
              <FolderOpen className="h-4 w-4 mr-2" />
              Move to bucket
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default MediaHub;
