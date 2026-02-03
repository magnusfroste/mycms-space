// ============================================
// Media Hub Picker Dialog
// Reusable dialog to select images from Media Hub
// ============================================

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Search, Check, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useMediaFiles,
  STORAGE_BUCKETS,
  BUCKET_LABELS,
  type StorageBucket,
  type MediaFile,
} from '@/models/mediaHub';

interface MediaHubPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (file: MediaFile) => void;
  selectedUrl?: string;
}

const MediaHubPicker: React.FC<MediaHubPickerProps> = ({
  open,
  onOpenChange,
  onSelect,
  selectedUrl,
}) => {
  const { data: files = [], isLoading } = useMediaFiles();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBucket, setSelectedBucket] = useState<StorageBucket | 'all'>('all');

  // Filter files
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

    // Sort by date
    result.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return result;
  }, [files, selectedBucket, searchQuery]);

  const handleSelect = (file: MediaFile) => {
    onSelect(file);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select from Media Hub</DialogTitle>
        </DialogHeader>

        {/* Filters */}
        <div className="flex gap-3 py-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={selectedBucket}
            onValueChange={(v) => setSelectedBucket(v as StorageBucket | 'all')}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All buckets" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All buckets</SelectItem>
              {STORAGE_BUCKETS.map(bucket => (
                <SelectItem key={bucket} value={bucket}>
                  {BUCKET_LABELS[bucket]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* File Grid */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {Array.from({ length: 15 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mb-4 opacity-50" />
              <p>No images found</p>
              {searchQuery && (
                <Button 
                  variant="link" 
                  onClick={() => setSearchQuery('')}
                  className="mt-2"
                >
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredFiles.map(file => {
                const isSelected = file.publicUrl === selectedUrl;
                return (
                  <button
                    key={file.id}
                    onClick={() => handleSelect(file)}
                    className={cn(
                      "relative aspect-square rounded-lg overflow-hidden border-2 transition-all",
                      "hover:border-primary hover:shadow-md",
                      isSelected ? "border-primary ring-2 ring-primary/30" : "border-transparent"
                    )}
                  >
                    <img
                      src={file.publicUrl}
                      alt={file.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <Check className="h-8 w-8 text-primary-foreground bg-primary rounded-full p-1" />
                      </div>
                    )}
                    <Badge 
                      variant="secondary" 
                      className="absolute bottom-1 left-1 text-xs opacity-90"
                    >
                      {BUCKET_LABELS[file.bucket]}
                    </Badge>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {filteredFiles.length} images available
          </p>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaHubPicker;
