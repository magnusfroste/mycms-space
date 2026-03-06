import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Bot, RefreshCw, ShieldAlert, RotateCcw } from 'lucide-react';
import TaskHistoryItem from './autopilot/TaskHistoryItem';
import WorkflowVisualizer from './autopilot/WorkflowVisualizer';

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

export default function AutopilotDashboard() {
  const queryClient = useQueryClient();
  const [taskFilter, setTaskFilter] = useState<'all' | 'signal' | 'research' | 'blog'>('all');

  // Self-healing: detect recently auto-disabled skills
  const { data: disabledSkills = [] } = useQuery({
    queryKey: ['self-healed-skills'],
    queryFn: async () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const { data } = await supabase
        .from('agent_activity')
        .select('skill_name, created_at')
        .eq('status', 'failed')
        .gte('created_at', threeDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (!data?.length) return [];

      // Find skills with 3+ consecutive failures
      const streaks: Record<string, number> = {};
      const checked = new Set<string>();
      for (const a of data) {
        if (checked.has(a.skill_name)) continue;
        streaks[a.skill_name] = (streaks[a.skill_name] || 0) + 1;
        if (streaks[a.skill_name] >= 3) checked.add(a.skill_name);
      }

      const candidates = Object.entries(streaks).filter(([, c]) => c >= 3).map(([n]) => n);
      if (!candidates.length) return [];

      // Check which are actually disabled
      const { data: skills } = await supabase
        .from('agent_skills')
        .select('id, name, description')
        .eq('enabled', false)
        .in('name', candidates);

      return skills || [];
    },
    refetchInterval: 60_000,
  });

  const reEnableSkill = useMutation({
    mutationFn: async (skillName: string) => {
      const { error } = await supabase
        .from('agent_skills')
        .update({ enabled: true })
        .eq('name', skillName);
      if (error) throw error;
      // Also re-enable linked automations
      await supabase
        .from('agent_automations')
        .update({ enabled: true, last_error: null })
        .eq('skill_name', skillName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['self-healed-skills'] });
      queryClient.invalidateQueries({ queryKey: ['agent-skills'] });
      toast.success('Skill re-enabled');
    },
    onError: (e) => toast.error('Failed to re-enable', { description: e.message }),
  });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['agent-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_tasks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as AgentTask[];
    },
  });

  const publishDraft = useMutation({
    mutationFn: async (task: AgentTask) => {
      const output = task.output_data || {};
      const slug = (output.slug as string) || '';
      if (!slug) throw new Error('No slug found in task output');

      const { error } = await supabase
        .from('blog_posts')
        .update({ status: 'published', published_at: new Date().toISOString() })
        .eq('slug', slug);
      if (error) throw error;

      await supabase
        .from('agent_tasks')
        .update({ status: 'completed' })
        .eq('id', task.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-tasks'] });
      toast.success('Blog post published!');
    },
    onError: (e) => toast.error('Failed to publish', { description: e.message }),
  });

  const stats = useMemo(() => [
    { label: 'Total Tasks', value: tasks.length },
    { label: 'Needs Review', value: tasks.filter(t => t.status === 'needs_review').length },
    { label: 'Blog Drafts', value: tasks.filter(t => t.task_type === 'blog_draft').length },
    { label: 'Research', value: tasks.filter(t => t.task_type === 'research').length },
  ], [tasks]);

  const pendingSignals = tasks.filter(t => t.task_type === 'signal' && t.status === 'pending').length;
  const filtered = taskFilter === 'all' ? tasks : tasks.filter(t => t.task_type === taskFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Autopilot</h1>
          <p className="text-muted-foreground">Activity log &amp; scheduled workflows</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Bot className="h-4 w-4" />
          <span>Use the <strong>Magnet</strong> tab to run tasks conversationally</span>
        </div>
      </div>

      {/* Self-healing alerts */}
      {disabledSkills.length > 0 && (
        <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle className="text-sm font-semibold">Self-Healing Alert</AlertTitle>
          <AlertDescription className="mt-1 space-y-2">
            <p className="text-xs">
              {disabledSkills.length} skill{disabledSkills.length > 1 ? 's were' : ' was'} auto-disabled due to repeated failures:
            </p>
            <div className="flex flex-wrap gap-2">
              {disabledSkills.map((s: any) => (
                <span key={s.id} className="inline-flex items-center gap-1.5">
                  <Badge variant="outline" className="text-xs border-destructive/30">{s.name.replace(/_/g, ' ')}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs gap-1"
                    onClick={() => reEnableSkill.mutate(s.name)}
                    disabled={reEnableSkill.isPending}
                  >
                    <RotateCcw className="h-3 w-3" /> Re-enable
                  </Button>
                </span>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Workflow Visualizer */}
      <WorkflowVisualizer />

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold">{stat.value}</span>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Task History */}
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Activity Log</CardTitle>
            <CardDescription>Recent autonomous agent activity</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Tabs value={taskFilter} onValueChange={(v) => setTaskFilter(v as typeof taskFilter)}>
              <TabsList className="h-8">
                <TabsTrigger value="all" className="text-xs px-2.5 h-6">All</TabsTrigger>
                <TabsTrigger value="signal" className="text-xs px-2.5 h-6 gap-1">
                  Signals
                  {pendingSignals > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-medium min-w-[18px] h-[18px] px-1">
                      {pendingSignals}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="research" className="text-xs px-2.5 h-6">Research</TabsTrigger>
                <TabsTrigger value="blog" className="text-xs px-2.5 h-6">Blog</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="ghost" size="icon" onClick={() => queryClient.invalidateQueries({ queryKey: ['agent-tasks'] })}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {taskFilter === 'all' ? 'No tasks yet. Ask Magnet to research a topic.' : `No ${taskFilter} tasks yet.`}
            </p>
          ) : (
            <div className="space-y-2">
              {filtered.map(task => (
                <TaskHistoryItem
                  key={task.id}
                  task={task}
                  onPublish={(t) => publishDraft.mutate(t)}
                  isPublishing={publishDraft.isPending}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
