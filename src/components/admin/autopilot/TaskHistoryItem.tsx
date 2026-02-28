import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Clock, CheckCircle, AlertCircle, Eye, Search, PenSquare, Mail, Rocket, ChevronDown } from 'lucide-react';
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
};

function hasPreviewContent(task: AgentTask): boolean {
  const o = task.output_data || {};
  return !!(o.analysis || o.content || o.excerpt || o.title || o.subject);
}

function TaskPreview({ task }: { task: AgentTask }) {
  const o = task.output_data || {};

  if (task.task_type === 'research') {
    return (
      <div className="space-y-2 text-sm">
        {o.title && <h4 className="font-medium">{o.title as string}</h4>}
        {o.analysis && (
          <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {(o.analysis as string).substring(0, 1500)}
            {(o.analysis as string).length > 1500 && '…'}
          </p>
        )}
      </div>
    );
  }

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

  return null;
}

interface TaskHistoryItemProps {
  task: AgentTask;
  onPublish: (task: AgentTask) => void;
  isPublishing: boolean;
}

export default function TaskHistoryItem({ task, onPublish, isPublishing }: TaskHistoryItemProps) {
  const [expanded, setExpanded] = useState(false);
  const status = statusConfig[task.status] || statusConfig.pending;
  const type = taskTypeLabels[task.task_type] || taskTypeLabels.research;
  const StatusIcon = status.icon;
  const TypeIcon = type.icon;
  const inputData = task.input_data || {};
  const outputData = task.output_data || {};
  const canExpand = hasPreviewContent(task);
  const canPublish = task.task_type === 'blog_draft' && (task.status === 'needs_review' || task.status === 'completed') && !!(outputData.slug as string);

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
            <TaskPreview task={task} />
          </div>
        </div>
      )}
    </div>
  );
}
