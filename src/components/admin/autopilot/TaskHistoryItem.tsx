import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Clock, CheckCircle, AlertCircle, Eye, Search, PenSquare, Mail, Rocket, ChevronDown, FileEdit, Save, X, Inbox, Radar, ExternalLink, Copy, BookmarkPlus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type AgentTask = {
  id: string;
  task_type: string;
  status: string;
  input_data: Record<string, unknown>;
  output_data: Record<string, unknown>;
  created_at: string;
  completed_at: string | null;
  batch_id?: string | null;
};

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Clock }> = {
  pending: { label: 'Pending', variant: 'outline', icon: Clock },
  running: { label: 'Running', variant: 'secondary', icon: Loader2 },
  completed: { label: 'Completed', variant: 'default', icon: CheckCircle },
  needs_review: { label: 'Needs Review', variant: 'secondary', icon: Eye },
  failed: { label: 'Failed', variant: 'destructive', icon: AlertCircle },
};

const taskTypeLabels: Record<string, { label: string; icon: typeof Search }> = {
  research: { label: 'Research', icon: Search },
  blog_draft: { label: 'Blog Draft', icon: PenSquare },
  newsletter_draft: { label: 'Newsletter', icon: Mail },
  inbox_digest: { label: 'Inbox Digest', icon: Inbox },
  scout: { label: 'Scout', icon: Radar },
};

function hasPreviewContent(task: AgentTask): boolean {
  const o = task.output_data || {};
  return !!(o.analysis || o.research_summary || o.content || o.excerpt || o.title || o.subject || o.sources);
}

// Read-only preview for blog drafts and newsletters
function ReadOnlyPreview({ task }: { task: AgentTask }) {
  const o = task.output_data || {};

  if (task.task_type === 'blog_draft') {
    return (
      <div className="space-y-2 text-sm">
        {o.title && <h4 className="font-medium">{o.title as string}</h4>}
        {o.excerpt && <p className="text-muted-foreground italic">{o.excerpt as string}</p>}
        {o.content && (
          <div className="text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto border-t pt-2 mt-2">
            {(o.content as string).substring(0, 2000)}
            {(o.content as string).length > 2000 && '…'}
          </div>
        )}
        {o.seo_keywords && (
          <div className="flex flex-wrap gap-1 mt-1">
            {(o.seo_keywords as string[]).map((kw, i) => (
              <Badge key={i} variant="outline" className="text-xs">{kw}</Badge>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (task.task_type === 'newsletter_draft') {
    return (
      <div className="space-y-2 text-sm">
        {o.subject && <h4 className="font-medium">{o.subject as string}</h4>}
        {o.content && (
          <div className="text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
            {(o.content as string).substring(0, 2000)}
            {(o.content as string).length > 2000 && '…'}
          </div>
        )}
      </div>
    );
  }

  if (task.task_type === 'inbox_digest') {
    return (
      <div className="space-y-2 text-sm">
        {o.email && <p className="text-xs text-muted-foreground">Account: {o.email as string}</p>}
        <p className="text-xs text-muted-foreground">{o.signal_count as number} signals · {o.scan_period_days as number} day scan</p>
        {o.analysis && (
          <div className="text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
            {(o.analysis as string).substring(0, 2000)}
            {(o.analysis as string).length > 2000 && '…'}
          </div>
        )}
        {(o.suggested_topics as string[])?.length > 0 && (
          <div className="space-y-1 mt-2">
            <p className="text-xs font-medium">Suggested blog topics:</p>
            <div className="flex flex-wrap gap-1">
              {(o.suggested_topics as string[]).map((t, i) => (
                <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}

// Scout source discovery preview
function ScoutPreview({ task, onUseSources, onRunAction }: { task: AgentTask; onUseSources?: (urls: string[]) => void; onRunAction?: (action: string, topic: string, sources: string[]) => void }) {
  const queryClient = useQueryClient();
  const o = task.output_data || {};
  const sources = (o.sources as Array<{ url: string; title: string; score: number; rationale: string }>) || [];
  const synthesis = (o.synthesis as string) || '';
  const watchList = (o.watch_list as string[]) || [];
  const topic = (o.topic as string) || (task.input_data?.topic as string) || '';
  const sourceUrls = sources.map(s => s.url);

  const saveDefaultsMutation = useMutation({
    mutationFn: async () => {
      // Fetch current autopilot config
      const { data: existing } = await supabase
        .from('modules')
        .select('id, module_config')
        .eq('module_type', 'autopilot')
        .single();

      const currentConfig = (existing?.module_config as Record<string, unknown>) || {};
      const updatedConfig = {
        ...currentConfig,
        default_topic: topic || currentConfig.default_topic,
        default_sources: sourceUrls,
      };

      if (existing?.id) {
        const { error } = await supabase.from('modules').update({ module_config: updatedConfig as any }).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('modules').insert([{ module_type: 'autopilot', module_config: updatedConfig as any, enabled: true }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['autopilot-config'] });
      toast.success('Saved as defaults', { description: `${sourceUrls.length} sources set as default for scheduled research` });
    },
    onError: (e) => toast.error('Failed to save defaults', { description: e.message }),
  });

  return (
    <div className="space-y-3 text-sm">
      {/* Sources list */}
      {sources.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium">Discovered Sources ({sources.length})</p>
            <div className="flex items-center gap-1.5">
              {onRunAction && topic && (
                <>
                  <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => onRunAction('research', topic, sourceUrls)}>
                    <Search className="h-3 w-3 mr-1" />
                    Research
                  </Button>
                  <Button size="sm" className="text-xs h-7" onClick={() => onRunAction('blog_draft', topic, sourceUrls)}>
                    <PenSquare className="h-3 w-3 mr-1" />
                    Draft Blog
                  </Button>
                </>
              )}
              {onUseSources && (
                <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => onUseSources(sourceUrls)}>
                  <Copy className="h-3 w-3 mr-1" />
                  Copy URLs
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="text-xs h-7"
                onClick={() => saveDefaultsMutation.mutate()}
                disabled={saveDefaultsMutation.isPending}
              >
                {saveDefaultsMutation.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <BookmarkPlus className="h-3 w-3 mr-1" />}
                Save as Defaults
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            {sources.map((source, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded border bg-background">
                <Badge variant="outline" className="text-[10px] shrink-0 mt-0.5">{source.score}/10</Badge>
                <div className="min-w-0 flex-1">
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium hover:underline flex items-center gap-1"
                  >
                    {source.title}
                    <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
                  </a>
                  {source.rationale && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">{source.rationale}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Watch list */}
      {watchList.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium">Watch List</p>
          <div className="flex flex-wrap gap-1">
            {watchList.map((domain, i) => (
              <Badge key={i} variant="secondary" className="text-xs">{domain}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Synthesis */}
      {synthesis && (
        <div className="border-t pt-2">
          <p className="text-xs font-medium mb-1">Synthesis</p>
          <div className="text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto text-xs">
            {synthesis.substring(0, 2000)}
            {synthesis.length > 2000 && '…'}
          </div>
        </div>
      )}
    </div>
  );
}

// Editable research preview
function ResearchPreview({ task, onSaved }: { task: AgentTask; onSaved: () => void }) {
  const o = task.output_data || {};
  const summary = (o.research_summary as string) || (o.analysis as string) || '';
  const topic = (o.topic as string) || (task.input_data?.topic as string) || '';

  const [editing, setEditing] = useState(false);
  const [editTopic, setEditTopic] = useState(topic);
  const [editSummary, setEditSummary] = useState(summary);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const updatedOutput = {
        ...task.output_data,
        topic: editTopic,
        research_summary: editSummary,
        // Keep analysis in sync if it existed
        ...(o.analysis ? { analysis: editSummary } : {}),
      };
      const { error } = await supabase
        .from('agent_tasks')
        .update({ output_data: updatedOutput as any })
        .eq('id', task.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setEditing(false);
      onSaved();
      toast.success('Research updated');
    },
    onError: (e) => toast.error('Save failed', { description: e.message }),
  });

  if (editing) {
    return (
      <div className="space-y-3 text-sm">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Topic</label>
          <input
            className="w-full px-2.5 py-1.5 rounded-md border bg-background text-sm"
            value={editTopic}
            onChange={(e) => setEditTopic(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Research Summary</label>
          <textarea
            className="w-full px-2.5 py-1.5 rounded-md border bg-background text-sm min-h-[200px] resize-y leading-relaxed"
            value={editSummary}
            onChange={(e) => setEditSummary(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setEditTopic(topic); setEditSummary(summary); }}>
            <X className="h-3 w-3 mr-1" />
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 text-sm">
      {(topic || editTopic) && <h4 className="font-medium">{topic}</h4>}
      {summary && (
        <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
          {summary.substring(0, 1500)}
          {summary.length > 1500 && '…'}
        </p>
      )}
      <Button size="sm" variant="ghost" className="text-xs mt-1" onClick={() => setEditing(true)}>
        <PenSquare className="h-3 w-3 mr-1" />
        Edit Research
      </Button>
    </div>
  );
}

interface TaskHistoryItemProps {
  task: AgentTask;
  onPublish: (task: AgentTask) => void;
  isPublishing: boolean;
  onUseSources?: (urls: string[]) => void;
  onRunAction?: (action: string, topic: string, sources: string[]) => void;
}

export default function TaskHistoryItem({ task, onPublish, isPublishing, onUseSources, onRunAction }: TaskHistoryItemProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const status = statusConfig[task.status] || statusConfig.pending;
  const type = taskTypeLabels[task.task_type] || taskTypeLabels.research;
  const StatusIcon = status.icon;
  const TypeIcon = type.icon;
  const inputData = task.input_data || {};
  const outputData = task.output_data || {};
  const canExpand = hasPreviewContent(task);
  const canPublish = task.task_type === 'blog_draft' && (task.status === 'needs_review' || task.status === 'completed') && !!(outputData.slug as string);
  const canEditBlog = task.task_type === 'blog_draft' && !!(outputData.blog_post_id as string);

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <button
        type="button"
        className={cn(
          "flex items-start gap-3 p-3 w-full text-left transition-colors",
          canExpand && "hover:bg-accent/30 cursor-pointer",
          !canExpand && "cursor-default"
        )}
        onClick={() => canExpand && setExpanded(!expanded)}
      >
        <TypeIcon className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{type.label}</span>
            <Badge variant={status.variant} className="text-xs">
              <StatusIcon className={`h-3 w-3 mr-1 ${task.status === 'running' ? 'animate-spin' : ''}`} />
              {status.label}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground truncate mt-0.5">
            {(inputData.topic as string) || (outputData.title as string) || (outputData.subject as string) || task.task_type}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {format(new Date(task.created_at), 'MMM d, HH:mm')}
            {task.completed_at && ` · Done ${format(new Date(task.completed_at), 'HH:mm')}`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {canEditBlog && (
            <Button
              size="sm"
              variant="ghost"
              className="text-xs"
              onClick={(e) => { e.stopPropagation(); navigate(`/admin?tab=blog&editPostId=${outputData.blog_post_id}`); }}
            >
              <FileEdit className="h-3 w-3 mr-1" />
              Edit
            </Button>
          )}
          {canPublish && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              disabled={isPublishing}
              onClick={(e) => { e.stopPropagation(); onPublish(task); }}
            >
              {isPublishing ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Rocket className="h-3 w-3 mr-1" />}
              Publish
            </Button>
          )}
          {canExpand && (
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", expanded && "rotate-180")} />
          )}
        </div>
      </button>
      {expanded && canExpand && (
        <div className="px-3 pb-3 pl-10 border-t bg-muted/30">
          <div className="pt-3">
            {task.task_type === 'research' ? (
              <ResearchPreview task={task} onSaved={() => queryClient.invalidateQueries({ queryKey: ['agent-tasks'] })} />
            ) : task.task_type === 'scout' ? (
              <ScoutPreview task={task} onUseSources={onUseSources} onRunAction={onRunAction} />
            ) : (
              <ReadOnlyPreview task={task} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
