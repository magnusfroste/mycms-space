import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Clock, CheckCircle, AlertCircle, Eye, Search, PenSquare, Mail, Rocket, ChevronDown, FileEdit, Save, X, Inbox, Radar, ExternalLink, Copy, BookmarkPlus, Zap, Linkedin, Globe, Twitter, Layers } from 'lucide-react';
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
  linkedin_post: { label: 'LinkedIn', icon: ExternalLink },
  x_thread: { label: 'X Thread', icon: ExternalLink },
  multichannel_draft: { label: 'Multichannel', icon: Radar },
  signal: { label: 'Signal', icon: Zap },
};

function hasPreviewContent(task: AgentTask): boolean {
  if (task.task_type === 'signal') return true;
  const o = task.output_data || {};
  return !!(o.analysis || o.research_summary || o.content || o.excerpt || o.title || o.subject || o.sources || o.tweets || o.channels || o.brief);
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

  // LinkedIn post preview
  if (task.task_type === 'linkedin_post') {
    return (
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">LinkedIn</Badge>
          <span className="text-xs text-muted-foreground">{(o.char_count as number) || (o.content as string)?.length || 0} chars</span>
        </div>
        {o.content && (
          <div className="text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto border rounded p-3 bg-background">
            {o.content as string}
          </div>
        )}
        <Button
          size="sm" variant="outline" className="text-xs h-7"
          onClick={() => { navigator.clipboard.writeText(o.content as string || ''); toast.success('Copied to clipboard'); }}
        >
          <Copy className="h-3 w-3 mr-1" /> Copy
        </Button>
      </div>
    );
  }

  // X/Twitter thread preview
  if (task.task_type === 'x_thread') {
    const tweets = (o.tweets as string[]) || [];
    return (
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">X Thread</Badge>
          <span className="text-xs text-muted-foreground">{tweets.length || (o.tweet_count as number) || 0} tweets</span>
        </div>
        {tweets.length > 0 ? (
          <div className="space-y-2">
            {tweets.map((tweet, i) => (
              <div key={i} className="border rounded p-2 bg-background text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-muted-foreground font-mono">{i + 1}/{tweets.length}</span>
                  <span className={cn("text-[10px]", tweet.length > 280 ? "text-destructive" : "text-muted-foreground")}>{tweet.replace(/^\d+\/\s*/, '').length}/280</span>
                </div>
                <p className="whitespace-pre-wrap">{tweet}</p>
              </div>
            ))}
          </div>
        ) : o.content ? (
          <div className="text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto border rounded p-3 bg-background">
            {o.content as string}
          </div>
        ) : null}
        <Button
          size="sm" variant="outline" className="text-xs h-7"
          onClick={() => { navigator.clipboard.writeText(o.content as string || tweets.join('\n\n')); toast.success('Copied to clipboard'); }}
        >
          <Copy className="h-3 w-3 mr-1" /> Copy All
        </Button>
      </div>
    );
  }

  // Multichannel parent preview
  if (task.task_type === 'multichannel_draft') {
    const channels = (o.channels as string[]) || [];
    return (
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium">Channels:</span>
          {channels.map(ch => (
            <Badge key={ch} variant="secondary" className="text-xs">{ch}</Badge>
          ))}
        </div>
        {o.brief && (
          <div className="border-t pt-2">
            <p className="text-xs font-medium mb-1">Content Brief</p>
            <div className="text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto text-xs">
              {(o.brief as string).substring(0, 1500)}
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
// Scout source discovery preview (read-only)
function ScoutPreview({ task }: { task: AgentTask }) {
  const o = task.output_data || {};
  const sources = (o.sources as Array<{ url: string; title: string; score: number; rationale: string }>) || [];
  const synthesis = (o.synthesis as string) || '';
  const watchList = (o.watch_list as string[]) || [];

  return (
    <div className="space-y-3 text-sm">
      {sources.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium">Discovered Sources ({sources.length})</p>
          <div className="space-y-1.5">
            {sources.map((source, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded border bg-background">
                <Badge variant="outline" className="text-[10px] shrink-0 mt-0.5">{source.score}/10</Badge>
                <div className="min-w-0 flex-1">
                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium hover:underline flex items-center gap-1">
                    {source.title}
                    <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
                  </a>
                  {source.rationale && <p className="text-[11px] text-muted-foreground mt-0.5">{source.rationale}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {watchList.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium">Watch List</p>
          <div className="flex flex-wrap gap-1">
            {watchList.map((domain, i) => <Badge key={i} variant="secondary" className="text-xs">{domain}</Badge>)}
          </div>
        </div>
      )}
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

// Read-only research preview
function ResearchPreview({ task }: { task: AgentTask }) {
  const o = task.output_data || {};
  const summary = (o.research_summary as string) || (o.analysis as string) || '';
  const topic = (o.topic as string) || (task.input_data?.topic as string) || '';

  return (
    <div className="space-y-2 text-sm">
      {topic && <h4 className="font-medium">{topic}</h4>}
      {summary && (
        <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
          {summary.substring(0, 1500)}
          {summary.length > 1500 && '…'}
        </p>
      )}
    </div>
  );
}

const sourceIcons: Record<string, typeof Globe> = {
  linkedin: Linkedin,
  x: Twitter,
  twitter: Twitter,
  web: Globe,
};

function SignalPreview({ task }: { task: AgentTask }) {
  const i = task.input_data || {};
  const url = (i.url as string) || '';
  const title = (i.title as string) || '';
  const content = (i.content as string) || '';
  const note = (i.note as string) || '';
  const sourceType = (i.source_type as string) || 'web';
  const SourceIcon = sourceIcons[sourceType] || Globe;

  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center gap-2">
        <SourceIcon className="h-4 w-4 text-muted-foreground" />
        <Badge variant="outline" className="text-xs capitalize">{sourceType}</Badge>
        {url && (
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:underline flex items-center gap-1 truncate max-w-xs">
            {new URL(url).hostname}
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
        )}
      </div>
      {title && <h4 className="font-medium">{title}</h4>}
      {note && <p className="text-xs italic text-muted-foreground border-l-2 border-primary/30 pl-2">{note}</p>}
      {content && (
        <div className="text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto border rounded p-3 bg-background text-xs">
          {content.substring(0, 3000)}
          {content.length > 3000 && '…'}
        </div>
      )}
      {content && (
        <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => { navigator.clipboard.writeText(content); toast.success('Content copied'); }}>
          <Copy className="h-3 w-3 mr-1" /> Copy content
        </Button>
      )}
    </div>
  );
}

interface TaskHistoryItemProps {
  task: AgentTask;
  onPublish: (task: AgentTask) => void;
  isPublishing: boolean;
}

export default function TaskHistoryItem({ task, onPublish, isPublishing }: TaskHistoryItemProps) {
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
  const canPublish = task.task_type === 'blog_draft' && task.status === 'needs_review' && !!(outputData.slug as string);
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
            {(inputData.topic as string) || (inputData.title as string) || (outputData.title as string) || (outputData.subject as string) || task.task_type}
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
            {task.task_type === 'signal' ? (
              <SignalPreview task={task} />
            ) : task.task_type === 'research' ? (
              <ResearchPreview task={task} />
            ) : task.task_type === 'scout' ? (
              <ScoutPreview task={task} />
            ) : (
              <ReadOnlyPreview task={task} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
