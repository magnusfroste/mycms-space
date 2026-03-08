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
import { RefreshCw, ShieldAlert, RotateCcw, Clock, Zap, Radio, Calendar } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useAutomations, useToggleAutomation } from '@/hooks/useAutomations';
import { formatDistanceToNow } from 'date-fns';
import TaskHistoryItem from '../autopilot/TaskHistoryItem';

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

const triggerIcons: Record<string, typeof Clock> = {
  cron: Clock,
  event: Zap,
  signal: Radio,
};

function AutomationsSummary() {
  const { data: automations = [], isLoading } = useAutomations();
  const toggle = useToggleAutomation();

  if (isLoading) return <Skeleton className="h-24 w-full" />;
  if (automations.length === 0) return null;

  const active = automations.filter(a => a.enabled);
  const inactive = automations.length - active.length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Automations</CardTitle>
            <CardDescription>{active.length} active{inactive > 0 ? ` · ${inactive} paused` : ''}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {automations.map(auto => {
            const TriggerIcon = triggerIcons[auto.trigger_type] || Zap;
            const cronSchedule = auto.trigger_type === 'cron' 
              ? (auto.trigger_config as Record<string, unknown>)?.schedule as string 
              : null;

            return (
              <div
                key={auto.id}
                className="flex items-center gap-3 rounded-lg border bg-card p-3"
              >
                <div className={`h-2 w-2 rounded-full shrink-0 ${auto.enabled ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`} />
                <TriggerIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{auto.name.replace(/_/g, ' ')}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-[10px] capitalize">{auto.trigger_type}</Badge>
                    {cronSchedule && <span className="font-mono text-[10px]">{cronSchedule}</span>}
                    {auto.last_triggered_at && (
                      <span>Last: {formatDistanceToNow(new Date(auto.last_triggered_at), { addSuffix: true })}</span>
                    )}
                    {auto.next_run_at && (
                      <span className="flex items-center gap-0.5">
                        <Calendar className="h-3 w-3" />
                        Next: {formatDistanceToNow(new Date(auto.next_run_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                </div>
                {auto.last_error && (
                  <Badge variant="destructive" className="text-[10px] shrink-0">Error</Badge>
                )}
                <span className="text-[10px] text-muted-foreground shrink-0">{auto.run_count} runs</span>
                <Switch
                  checked={auto.enabled}
                  onCheckedChange={(checked) => toggle.mutate({ id: auto.id, enabled: checked })}
                  disabled={toggle.isPending}
                  className="scale-75 shrink-0"
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default function OverviewPanel() {
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

      const streaks: Record<string, number> = {};
      const checked = new Set<string>();
      for (const a of data) {
        if (checked.has(a.skill_name)) continue;
        streaks[a.skill_name] = (streaks[a.skill_name] || 0) + 1;
        if (streaks[a.skill_name] >= 3) checked.add(a.skill_name);
      }

      const candidates = Object.entries(streaks).filter(([, c]) => c >= 3).map(([n]) => n);
      if (!candidates.length) return [];

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

      {/* Active Automations */}
      <AutomationsSummary />

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
