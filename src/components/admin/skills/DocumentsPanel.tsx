// ============================================
// Documents Panel for Agency Dashboard
// Shows files from cms-files + agent-documents buckets
// ============================================

import { useState, useMemo } from 'react';
import { FileText, Download, Trash2, Eye, FolderOpen, RefreshCw, Search, File, FileImage, FileCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

type DocBucket = 'cms-files' | 'agent-documents';

interface DocFile {
  id: string;
  name: string;
  bucket: DocBucket;
  path: string;
  publicUrl: string;
  size: number;
  createdAt: string;
  mimeType: string | null;
}

const BUCKETS: DocBucket[] = ['cms-files', 'agent-documents'];
const BUCKET_LABELS: Record<DocBucket, string> = {
  'cms-files': 'CMS Files',
  'agent-documents': 'Agent Documents',
};

async function listDocFiles(bucket?: DocBucket): Promise<DocFile[]> {
  const targets = bucket ? [bucket] : BUCKETS;
  const results = await Promise.all(
    targets.map(async (b) => {
      const { data, error } = await supabase.storage.from(b).list('', {
        limit: 500,
        sortBy: { column: 'created_at', order: 'desc' },
      });
      if (error || !data) return [];
      return data
        .filter((f) => f.id && f.name)
        .map((f) => {
          const { data: urlData } = supabase.storage.from(b).getPublicUrl(f.name);
          return {
            id: f.id,
            name: f.name,
            bucket: b,
            path: f.name,
            publicUrl: urlData.publicUrl,
            size: f.metadata?.size || 0,
            createdAt: f.created_at || '',
            mimeType: (f.metadata?.mimetype as string) || null,
          };
        });
    })
  );
  return results.flat().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFileIcon(mime: string | null, name: string) {
  if (mime?.startsWith('image/')) return FileImage;
  if (name.endsWith('.md') || name.endsWith('.txt')) return FileText;
  if (name.endsWith('.json') || name.endsWith('.csv')) return FileCode;
  return File;
}

function isPreviewable(mime: string | null, name: string): boolean {
  if (mime?.startsWith('image/')) return true;
  return /\.(md|txt|json|csv)$/i.test(name);
}

export default function DocumentsPanel() {
  const queryClient = useQueryClient();
  const [bucketFilter, setBucketFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [previewFile, setPreviewFile] = useState<DocFile | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const { data: files = [], isLoading, refetch } = useQuery({
    queryKey: ['agency-documents', bucketFilter],
    queryFn: () => listDocFiles(bucketFilter === 'all' ? undefined : (bucketFilter as DocBucket)),
    staleTime: 60_000,
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ bucket, path }: { bucket: DocBucket; path: string }) => {
      const { error } = await supabase.storage.from(bucket).remove([path]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('File deleted');
      queryClient.invalidateQueries({ queryKey: ['agency-documents'] });
    },
    onError: () => toast.error('Failed to delete file'),
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return files;
    const q = search.toLowerCase();
    return files.filter((f) => f.name.toLowerCase().includes(q) || f.bucket.includes(q));
  }, [files, search]);

  const handlePreview = async (file: DocFile) => {
    setPreviewFile(file);
    setPreviewContent(null);

    if (file.mimeType?.startsWith('image/')) {
      setPreviewContent(null); // Image uses URL directly
      return;
    }

    setPreviewLoading(true);
    try {
      const { data, error } = await supabase.storage.from(file.bucket).download(file.path);
      if (error) throw error;
      const text = await data.text();
      setPreviewContent(text.length > 20000 ? text.slice(0, 20000) + '\n\n... [truncated]' : text);
    } catch {
      setPreviewContent('Unable to load file preview.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownload = async (file: DocFile) => {
    try {
      const { data, error } = await supabase.storage.from(file.bucket).download(file.path);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download file');
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={bucketFilter} onValueChange={setBucketFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All buckets" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All buckets</SelectItem>
            {BUCKETS.map((b) => (
              <SelectItem key={b} value={b}>{BUCKET_LABELS[b]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" onClick={() => refetch()} title="Refresh">
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Badge variant="secondary" className="text-xs">{filtered.length} files</Badge>
      </div>

      {/* File List */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
          <FolderOpen className="h-10 w-10 opacity-40" />
          <p className="text-sm">No documents found</p>
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-22rem)]">
          <div className="space-y-1.5">
            {filtered.map((file) => {
              const Icon = getFileIcon(file.mimeType, file.name);
              return (
                <Card key={`${file.bucket}-${file.id}`} className="group hover:bg-muted/30 transition-colors">
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className="flex-shrink-0 h-9 w-9 rounded-md bg-muted flex items-center justify-center">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {BUCKET_LABELS[file.bucket]}
                        </Badge>
                        <span>{formatSize(file.size)}</span>
                        {file.createdAt && (
                          <span>{format(new Date(file.createdAt), 'MMM d, HH:mm')}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isPreviewable(file.mimeType, file.name) && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handlePreview(file)} title="Preview">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDownload(file)} title="Download">
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => deleteMutation.mutate({ bucket: file.bucket, path: file.path })}
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="truncate text-sm font-medium">
              {previewFile?.name}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {previewFile?.mimeType?.startsWith('image/') ? (
              <img
                src={previewFile.publicUrl}
                alt={previewFile.name}
                className="w-full rounded-md"
              />
            ) : previewLoading ? (
              <div className="space-y-2 py-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : (
              <pre className="text-xs font-mono whitespace-pre-wrap break-words p-4 bg-muted rounded-md">
                {previewContent}
              </pre>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
