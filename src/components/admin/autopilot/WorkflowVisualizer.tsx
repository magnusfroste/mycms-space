import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import {
  Clock, Mail, Search, PenSquare, Database, Brain, ChevronDown, RefreshCw, Loader2, Zap,
} from 'lucide-react';

// ============================================
// Types
// ============================================

interface CronJob {
  jobid: number;
  jobname: string;
  schedule: string;
  active: boolean;
  command: string;
}

interface WorkflowsResponse {
  cronJobs: CronJob[];
  modules: Record<string, { config: Record<string, unknown>; enabled: boolean }>;
  lastRun: Record<string, { status: string; created_at: string; completed_at: string | null }>;
}

interface WorkflowNode {
  icon: React.ReactNode;
  label: string;
  detail?: string;
  variant: 'trigger' | 'action' | 'output';
}

interface WorkflowDef {
  id: string;
  name: string;
  jobName: string;
  nodes: WorkflowNode[];
}

// ============================================
// Helpers
// ============================================

function cronToHuman(cron: string): string {
  const parts = cron.split(' ');
  if (parts.length !== 5) return cron;
  const [min, hour, dom, , dow] = parts;

  if (dom === '*' && dow === '*') return `Daily at ${hour.padStart(2, '0')}:${min.padStart(2, '0')} UTC`;
  if (dow === '1') return `Mondays at ${hour.padStart(2, '0')}:${min.padStart(2, '0')} UTC`;
  if (dow !== '*') {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${days[+dow] || dow} at ${hour.padStart(2, '0')}:${min.padStart(2, '0')} UTC`;
  }
  return cron;
}

const variantStyles: Record<string, string> = {
  trigger: 'border-blue-500/30 bg-blue-500/5 text-blue-400',
  action: 'border-purple-500/30 bg-purple-500/5 text-purple-400',
  output: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400',
};

const statusColors: Record<string, string> = {
  completed: 'bg-emerald-500',
  running: 'bg-amber-500 animate-pulse',
  failed: 'bg-red-500',
  needs_review: 'bg-blue-500',
  pending: 'bg-muted-foreground/40',
};

// ============================================
// Build workflow definitions from cron data
// ============================================

function buildWorkflows(cronJobs: CronJob[]): WorkflowDef[] {
  const workflows: WorkflowDef[] = [];

  for (const job of cronJobs) {
    const cmd = job.command || '';

    if (cmd.includes('agent-inbox-scan') || job.jobname.includes('inbox')) {
      workflows.push({
        id: `inbox-${job.jobid}`,
        name: 'Gmail Inbox Scan',
        jobName: job.jobname,
        nodes: [
          { icon: <Clock className="h-4 w-4" />, label: 'Schedule', detail: cronToHuman(job.schedule), variant: 'trigger' },
          { icon: <Mail className="h-4 w-4" />, label: 'Gmail Scan', detail: 'Inbox signals', variant: 'action' },
          { icon: <Brain className="h-4 w-4" />, label: 'AI Analysis', detail: 'Trend extraction', variant: 'action' },
          { icon: <Database className="h-4 w-4" />, label: 'agent_tasks', detail: 'inbox_digest', variant: 'output' },
        ],
      });
    } else if (cmd.includes('agent-autopilot') && cmd.includes('research')) {
      workflows.push({
        id: `research-${job.jobid}`,
        name: 'Daily Research',
        jobName: job.jobname,
        nodes: [
          { icon: <Clock className="h-4 w-4" />, label: 'Schedule', detail: cronToHuman(job.schedule), variant: 'trigger' },
          { icon: <Search className="h-4 w-4" />, label: 'Firecrawl', detail: 'Web research', variant: 'action' },
          { icon: <Brain className="h-4 w-4" />, label: 'AI Summary', detail: 'Key findings', variant: 'action' },
          { icon: <Database className="h-4 w-4" />, label: 'agent_tasks', detail: 'research', variant: 'output' },
        ],
      });
    } else if (cmd.includes('newsletter') || cmd.includes('blog')) {
      workflows.push({
        id: `content-${job.jobid}`,
        name: 'Content Generation',
        jobName: job.jobname,
        nodes: [
          { icon: <Clock className="h-4 w-4" />, label: 'Schedule', detail: cronToHuman(job.schedule), variant: 'trigger' },
          { icon: <PenSquare className="h-4 w-4" />, label: 'Draft', detail: cmd.includes('newsletter') ? 'Newsletter' : 'Blog post', variant: 'action' },
          { icon: <Brain className="h-4 w-4" />, label: 'AI Writer', variant: 'action' },
          { icon: <Database className="h-4 w-4" />, label: cmd.includes('newsletter') ? 'campaigns' : 'blog_posts', variant: 'output' },
        ],
      });
    } else {
      workflows.push({
        id: `custom-${job.jobid}`,
        name: job.jobname,
        jobName: job.jobname,
        nodes: [
          { icon: <Clock className="h-4 w-4" />, label: 'Schedule', detail: cronToHuman(job.schedule), variant: 'trigger' },
          { icon: <Zap className="h-4 w-4" />, label: 'Action', detail: job.jobname, variant: 'action' },
          { icon: <Database className="h-4 w-4" />, label: 'Output', variant: 'output' },
        ],
      });
    }
  }

  return workflows;
}

// ============================================
// Node Component
// ============================================

function FlowNode({ node }: { node: WorkflowNode }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${variantStyles[node.variant]} min-w-0`}>
      {node.icon}
      <div className="min-w-0">
        <p className="text-xs font-medium leading-tight truncate">{node.label}</p>
        {node.detail && (
          <p className="text-[10px] opacity-70 leading-tight truncate">{node.detail}</p>
        )}
      </div>
    </div>
  );
}

function FlowConnector() {
  return (
    <div className="hidden sm:flex items-center">
      <div className="w-4 sm:w-6 h-px bg-border" />
      <div className="w-0 h-0 border-t-[4px] border-b-[4px] border-l-[6px] border-t-transparent border-b-transparent border-l-border" />
    </div>
  );
}

// ============================================
// Workflow Row
// ============================================

function WorkflowRow({
  workflow,
  cronJob,
  lastRun,
  onToggle,
  onUpdateSchedule,
  isToggling,
  isUpdating,
}: {
  workflow: WorkflowDef;
  cronJob: CronJob;
  lastRun?: { status: string; created_at: string };
  onToggle: (jobName: string, active: boolean) => void;
  onUpdateSchedule: (jobName: string, schedule: string) => void;
  isToggling: boolean;
  isUpdating: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(cronJob.schedule);

  const handleSave = () => {
    if (draft.trim() && draft !== cronJob.schedule) {
      onUpdateSchedule(cronJob.jobname, draft.trim());
    }
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') { setDraft(cronJob.schedule); setEditing(false); }
  };

  // Sync draft when external data changes
  if (!editing && draft !== cronJob.schedule) setDraft(cronJob.schedule);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-lg border bg-card p-3 sm:p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`h-2 w-2 rounded-full shrink-0 ${cronJob.active ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`} />
            <span className="font-medium text-sm truncate">{workflow.name}</span>
            {lastRun && (
              <Badge variant="outline" className="text-[10px] hidden sm:inline-flex">
                <span className={`h-1.5 w-1.5 rounded-full mr-1 ${statusColors[lastRun.status] || statusColors.pending}`} />
                {lastRun.status}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Switch
              checked={cronJob.active}
              onCheckedChange={(checked) => onToggle(cronJob.jobname, checked)}
              disabled={isToggling}
              className="scale-90"
            />
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        {/* Flow nodes - horizontal on desktop, vertical on mobile */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0 overflow-x-auto pb-1">
          {workflow.nodes.map((node, i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
              {i > 0 && (
                <>
                  <div className="sm:hidden flex justify-center">
                    <div className="w-px h-3 bg-border" />
                  </div>
                  <FlowConnector />
                </>
              )}
              <FlowNode node={node} />
            </div>
          ))}
        </div>

        {/* Collapsible details with inline schedule editing */}
        <CollapsibleContent>
          <div className="pt-2 border-t space-y-3 text-xs text-muted-foreground">
            {/* Schedule editor */}
            <div className="space-y-1.5">
              <span className="font-medium text-foreground">Schedule</span>
              {editing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleSave}
                    className="h-7 text-xs font-mono max-w-[180px]"
                    placeholder="0 6 * * *"
                    autoFocus
                  />
                  <span className="text-[10px] opacity-60">{cronToHuman(draft)}</span>
                </div>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded border border-dashed border-border hover:border-primary/50 hover:bg-accent/50 transition-colors group"
                >
                  <code className="text-xs font-mono">{cronJob.schedule}</code>
                  <span className="text-[10px] opacity-60">({cronToHuman(cronJob.schedule)})</span>
                  <PenSquare className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                </button>
              )}
              {isUpdating && <span className="text-[10px] flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Saving…</span>}
            </div>

            {/* Other details */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="font-medium">Status:</span> {cronJob.active ? 'Active' : 'Paused'}
              </div>
              {lastRun && (
                <>
                  <div>
                    <span className="font-medium">Last run:</span>{' '}
                    {new Date(lastRun.created_at).toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Result:</span> {lastRun.status}
                  </div>
                </>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ============================================
// Main Component
// ============================================

export default function WorkflowVisualizer() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['autopilot-workflows'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('agent-autopilot', {
        body: { action: 'workflows' },
      });
      if (error) throw error;
      return data as WorkflowsResponse;
    },
    refetchInterval: 60_000,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ jobName, active }: { jobName: string; active: boolean }) => {
      const { error } = await supabase.functions.invoke('agent-autopilot', {
        body: { action: 'toggle_workflow', jobName, active },
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['autopilot-workflows'] });
      toast.success(`Workflow ${vars.active ? 'activated' : 'paused'}`);
    },
    onError: (e) => toast.error('Failed to toggle workflow', { description: e.message }),
  });

  const scheduleMutation = useMutation({
    mutationFn: async ({ jobName, schedule }: { jobName: string; schedule: string }) => {
      const { error } = await supabase.functions.invoke('agent-autopilot', {
        body: { action: 'toggle_workflow', jobName, active: true, schedule },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['autopilot-workflows'] });
      toast.success('Schedule updated');
    },
    onError: (e) => toast.error('Failed to update schedule', { description: e.message }),
  });

  const cronJobs = data?.cronJobs || [];
  const workflows = buildWorkflows(cronJobs);
  const cronMap = Object.fromEntries(cronJobs.map((j) => [j.jobname, j]));

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Workflows</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5" />
            Workflows
          </CardTitle>
          <CardDescription>Active automations and scheduled jobs</CardDescription>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['autopilot-workflows'] })}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {workflows.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No scheduled workflows found. Set up cron jobs to see them here.
          </p>
        ) : (
          <div className="space-y-3">
            {workflows.map((wf) => (
              <WorkflowRow
                key={wf.id}
                workflow={wf}
                cronJob={cronMap[wf.jobName] || { jobid: 0, jobname: wf.jobName, schedule: '?', active: false, command: '' }}
                lastRun={data?.lastRun?.[wf.id.split('-')[0]] as any}
                onToggle={(name, active) => toggleMutation.mutate({ jobName: name, active })}
                isToggling={toggleMutation.isPending}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
