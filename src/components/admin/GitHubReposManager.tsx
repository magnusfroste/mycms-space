// ============================================
// GitHub Repos Manager
// Admin panel for managing synced GitHub repos
// with enrichment (images, problem, why it matters)
// ============================================

import React, { useState, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { RichTextEditor } from '@/components/common';
import { supabase } from '@/integrations/supabase/client';
import { compressImage } from '@/lib/utils/imageCompression';
import MediaHubPicker from './MediaHubPicker';
import {
  useGitHubRepos,
  useSyncGitHubRepos,
  useUpdateGitHubRepo,
  useUpdateGitHubRepoOrder,
  useAddGitHubRepoImage,
  useDeleteGitHubRepoImage,
  useSyncToGitHub,
  type GitHubRepoWithImages,
} from '@/models/githubRepos';
import { useGitHubModule } from '@/models/modules';
import {
  Github,
  RefreshCw,
  GripVertical,
  Pencil,
  Trash2,
  Star,
  GitFork,
  ExternalLink,
  Check,
  X,
  Plus,
  ImagePlus,
  Upload,
  FolderOpen,
} from 'lucide-react';

// Language colors
const languageColors: Record<string, string> = {
  TypeScript: 'bg-blue-500',
  JavaScript: 'bg-yellow-400',
  Python: 'bg-green-500',
  Go: 'bg-cyan-500',
  Rust: 'bg-orange-500',
  HTML: 'bg-orange-600',
  CSS: 'bg-blue-600',
};

// Sortable repo item
interface SortableRepoItemProps {
  repo: GitHubRepoWithImages;
  onEdit: () => void;
  onToggle: (enabled: boolean) => void;
  onDelete: () => void;
}

const SortableRepoItem: React.FC<SortableRepoItemProps> = ({ 
  repo, 
  onEdit, 
  onToggle, 
  onDelete 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: repo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`p-3 ${!repo.enabled ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center gap-3">
        {/* Drag handle */}
        <button
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-1 -ml-1 touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </button>

        {/* Toggle */}
        <Switch
          checked={repo.enabled}
          onCheckedChange={onToggle}
        />

        {/* Repo info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">
              {repo.enriched_title || repo.name}
            </span>
            {repo.language && (
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${languageColors[repo.language] || 'bg-gray-400'}`} />
                {repo.language}
              </Badge>
            )}
            {repo.enriched_title && (
              <Badge variant="outline" className="text-xs">Enriched</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {repo.enriched_description || repo.description || 'No description'}
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3" />
            {repo.stars}
          </span>
          <span className="flex items-center gap-1">
            <GitFork className="h-3 w-3" />
            {repo.forks}
          </span>
          {repo.images.length > 0 && (
            <span className="flex items-center gap-1">
              <ImagePlus className="h-3 w-3" />
              {repo.images.length}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            asChild
          >
            <a href={repo.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

// Edit form for repo enrichment
interface RepoEditFormProps {
  repo: GitHubRepoWithImages;
  onSave: (updates: {
    enriched_title: string;
    enriched_description: string;
    problem_statement: string;
    why_it_matters: string;
  }) => void;
  onCancel: () => void;
  onAddImage: (file: File) => void;
  onAddImageFromUrl: (url: string) => void;
  onDeleteImage: (imageId: string) => void;
  onSyncToGitHub: (description: string) => void;
  isUploading: boolean;
  isSaving: boolean;
  isSyncing: boolean;
}

const RepoEditForm: React.FC<RepoEditFormProps> = ({
  repo,
  onSave,
  onCancel,
  onAddImage,
  onAddImageFromUrl,
  onDeleteImage,
  onSyncToGitHub,
  isUploading,
  isSaving,
  isSyncing,
}) => {
  const [formData, setFormData] = useState({
    enriched_title: repo.enriched_title || '',
    enriched_description: repo.enriched_description || '',
    problem_statement: repo.problem_statement || '',
    why_it_matters: repo.why_it_matters || '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mediaHubOpen, setMediaHubOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAddImage(file);
      e.target.value = '';
    }
  };

  return (
    <Card className="p-4 border-primary/50">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Github className="h-5 w-5" />
          <span className="font-medium">{repo.name}</span>
          <Badge variant="secondary">{repo.language}</Badge>
        </div>

        {/* Image Gallery */}
        <div className="space-y-2">
          <Label className="text-xs">Images</Label>
          <div className="flex flex-wrap gap-2">
            {repo.images.map((img) => (
              <div key={img.id} className="relative group">
                <img
                  src={img.image_url}
                  alt={img.alt_text || 'Repo image'}
                  className="h-20 w-32 object-cover rounded border"
                />
                <button
                  onClick={() => onDeleteImage(img.id)}
                  className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {/* Add from computer */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="h-20 w-16 border-2 border-dashed rounded flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors gap-1"
              title="Upload from computer"
            >
              {isUploading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span className="text-[10px]">Upload</span>
                </>
              )}
            </button>
            {/* Add from Media Hub */}
            <button
              onClick={() => setMediaHubOpen(true)}
              disabled={isUploading}
              className="h-20 w-16 border-2 border-dashed rounded flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors gap-1"
              title="Select from Media Hub"
            >
              <FolderOpen className="h-4 w-4" />
              <span className="text-[10px]">Media</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Media Hub Picker */}
        <MediaHubPicker
          open={mediaHubOpen}
          onOpenChange={setMediaHubOpen}
          onSelect={(file) => {
            onAddImageFromUrl(file.publicUrl);
            setMediaHubOpen(false);
          }}
        />

        {/* Enriched Title */}
        <div className="space-y-2">
          <Label className="text-xs">Display Title (optional override)</Label>
          <Input
            value={formData.enriched_title}
            onChange={(e) => setFormData({ ...formData, enriched_title: e.target.value })}
            placeholder={repo.name}
          />
        </div>

        {/* Enriched Description */}
        <div className="space-y-2">
          <Label className="text-xs">Description</Label>
          <RichTextEditor
            value={formData.enriched_description}
            onChange={(text) => setFormData({ ...formData, enriched_description: text })}
            title={repo.name}
            placeholder={repo.description || 'Add a rich description...'}
            minHeight="min-h-[100px]"
            showAI
            aiMode="text"
            aiContext="project description"
          />
        </div>

        {/* Problem Statement */}
        <div className="space-y-2">
          <Label className="text-xs">Problem Statement</Label>
          <RichTextEditor
            value={formData.problem_statement}
            onChange={(text) => setFormData({ ...formData, problem_statement: text })}
            title={repo.name}
            placeholder="What problem does this solve?"
            minHeight="min-h-[80px]"
            showAI
            aiMode="text"
            aiContext="problem statement"
          />
        </div>

        {/* Why It Matters */}
        <div className="space-y-2">
          <Label className="text-xs">Why It Matters</Label>
          <RichTextEditor
            value={formData.why_it_matters}
            onChange={(text) => setFormData({ ...formData, why_it_matters: text })}
            title={repo.name}
            placeholder="Why is this project important?"
            minHeight="min-h-[80px]"
            showAI
            aiMode="text"
            aiContext="project importance"
          />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2">
          <Button onClick={() => onSave(formData)} disabled={isSaving}>
            <Check className="h-4 w-4 mr-1" />
            Save
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onSyncToGitHub(formData.enriched_description || repo.description || '')}
            disabled={isSyncing || !formData.enriched_description}
            title="Push description to GitHub"
          >
            <Upload className={`h-4 w-4 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
            Sync to GitHub
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        </div>
      </div>
    </Card>
  );
};

// Main component
const GitHubReposManager: React.FC = () => {
  const { config: moduleConfig } = useGitHubModule();
  const { data: repos, isLoading } = useGitHubRepos();
  const syncMutation = useSyncGitHubRepos();
  const updateMutation = useUpdateGitHubRepo();
  const updateOrderMutation = useUpdateGitHubRepoOrder();
  const addImageMutation = useAddGitHubRepoImage();
  const deleteImageMutation = useDeleteGitHubRepoImage();
  const syncToGitHubMutation = useSyncToGitHub();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [syncingFor, setSyncingFor] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Sort: enabled first, then by order_index
  const sortedRepos = [...(repos || [])].sort((a, b) => {
    if (a.enabled !== b.enabled) return b.enabled ? 1 : -1;
    return a.order_index - b.order_index;
  });
  const enabledCount = sortedRepos.filter((r) => r.enabled).length;

  const handleSync = async () => {
    const username = moduleConfig?.username;
    if (!username) {
      toast.error('Configure GitHub username first');
      return;
    }

    try {
      const result = await syncMutation.mutateAsync(username);
      toast.success(`${result.synced} repos synced, ${result.new} new`);
    } catch (error) {
      toast.error('Sync failed');
    }
  };

  const handleToggle = (id: string, enabled: boolean) => {
    updateMutation.mutate({ id, updates: { enabled } });
  };

  const handleDelete = (repo: GitHubRepoWithImages) => {
    if (confirm(`Remove "${repo.name}" from local database?`)) {
      // Note: This just removes from local DB, not GitHub
      toast.success('Delete not implemented yet');
    }
  };

  const handleSaveEnrichment = (id: string, updates: {
    enriched_title: string;
    enriched_description: string;
    problem_statement: string;
    why_it_matters: string;
  }) => {
    updateMutation.mutate(
      { id, updates },
      {
        onSuccess: () => {
          setEditingId(null);
          toast.success('Changes saved');
        },
        onError: () => {
          toast.error('Could not save');
        },
      }
    );
  };

  const handleAddImage = async (repoId: string, file: File) => {
    setUploadingFor(repoId);

    try {
      const compressed = await compressImage(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
      });

      const ext = compressed.name.split('.').pop();
      const path = `github-repos/${repoId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('project-images')
        .upload(path, compressed);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('project-images')
        .getPublicUrl(path);

      await addImageMutation.mutateAsync({
        repoId,
        imageUrl: publicUrl,
        imagePath: path,
      });

      toast.success('Image uploaded');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed');
    } finally {
      setUploadingFor(null);
    }
  };

  // Add image from Media Hub URL (no upload needed)
  const handleAddImageFromUrl = async (repoId: string, imageUrl: string) => {
    try {
      await addImageMutation.mutateAsync({
        repoId,
        imageUrl,
        imagePath: null, // No local path since it's already in storage
      });
      toast.success('Image added from Media Hub');
    } catch (error) {
      console.error('Add image error:', error);
      toast.error('Could not add image');
    }
  };

  const handleDeleteImage = (imageId: string) => {
    if (confirm('Delete this image?')) {
      deleteImageMutation.mutate(imageId);
    }
  };

  const handleSyncToGitHub = async (repoId: string, fullName: string, description: string) => {
    setSyncingFor(repoId);
    try {
      const result = await syncToGitHubMutation.mutateAsync({ fullName, description });
      if (result.success) {
        toast.success('Description updated on GitHub');
      } else {
        toast.error(result.error || 'Sync failed');
      }
    } catch (error) {
      toast.error('Sync failed');
    } finally {
      setSyncingFor(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    console.log('[DnD] handleDragEnd triggered', { activeId: active?.id, overId: over?.id });
    
    if (!over || active.id === over.id) {
      console.log('[DnD] No change needed');
      return;
    }

    const oldIndex = sortedRepos.findIndex((r) => r.id === active.id);
    const newIndex = sortedRepos.findIndex((r) => r.id === over.id);
    console.log('[DnD] Indices', { oldIndex, newIndex });
    
    if (oldIndex === -1 || newIndex === -1) {
      console.log('[DnD] Invalid indices, aborting');
      return;
    }

    const reordered = [...sortedRepos];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    const updates = reordered.map((r, idx) => ({ id: r.id, order_index: idx }));
    console.log('[DnD] Updating order with', updates.length, 'items');
    
    updateOrderMutation.mutate(updates, {
      onSuccess: () => {
        console.log('[DnD] Order updated successfully');
        toast.success('Order updated');
      },
      onError: (error) => {
        console.error('[DnD] Order update failed', error);
        toast.error('Could not update order');
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Github className="h-5 w-5" />
            GitHub Repositories
          </h3>
          <p className="text-sm text-muted-foreground">
            {enabledCount} of {sortedRepos.length} enabled for display
          </p>
        </div>
        <Button 
          onClick={handleSync} 
          disabled={syncMutation.isPending}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
          Sync from GitHub
        </Button>
      </div>

      {/* Repos list */}
      {sortedRepos.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <Github className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No repositories synced yet.</p>
          <p className="text-sm">Click "Sync from GitHub" to fetch your repos.</p>
        </Card>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sortedRepos.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {sortedRepos.map((repo) =>
                editingId === repo.id ? (
                  <RepoEditForm
                    key={repo.id}
                    repo={repo}
                    onSave={(updates) => handleSaveEnrichment(repo.id, updates)}
                    onCancel={() => setEditingId(null)}
                    onAddImage={(file) => handleAddImage(repo.id, file)}
                    onAddImageFromUrl={(url) => handleAddImageFromUrl(repo.id, url)}
                    onDeleteImage={handleDeleteImage}
                    onSyncToGitHub={(desc) => handleSyncToGitHub(repo.id, repo.full_name, desc)}
                    isUploading={uploadingFor === repo.id}
                    isSaving={updateMutation.isPending}
                    isSyncing={syncingFor === repo.id}
                  />
                ) : (
                  <SortableRepoItem
                    key={repo.id}
                    repo={repo}
                    onEdit={() => setEditingId(repo.id)}
                    onToggle={(enabled) => handleToggle(repo.id, enabled)}
                    onDelete={() => handleDelete(repo)}
                  />
                )
              )}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};

export default GitHubReposManager;
