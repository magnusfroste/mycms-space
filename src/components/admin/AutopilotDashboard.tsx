import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Bot, Search, PenSquare, Mail, Loader2, Clock, CheckCircle, AlertCircle, Eye, RefreshCw, Settings2, Save } from 'lucide-react';
import { format } from 'date-fns';

type AgentTask = {
  id: string;
  task_type: string;
  status: string;
  input_data: Record<string, unknown>;
  output_data: Record<string, unknown>;
  created_at: string;
  completed_at: string | null;
};

interface AutopilotConfig {
  default_topic: string;
  default_sources: string[];
}

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

export default function AutopilotDashboard() {
  const queryClient = useQueryClient();
  const [topic, setTopic] = useState('');
  const [sources, setSources] = useState('');

  // Config state
  const [configTopic, setConfigTopic] = useState('');
  const [configSources, setConfigSources] = useState('');
  const [configDirty, setConfigDirty] = useState(false);

  // Load autopilot config from modules table
  const { data: configData } = useQuery({
    queryKey: ['autopilot-config'],
    queryFn: async () => {
      const { data } = await supabase
        .from('modules')
        .select('id, module_config, enabled')
        .eq('module_type', 'autopilot')
        .single();
      return data;
    },
  });

  useEffect(() => {
    if (configData?.module_config) {
      const cfg = configData.module_config as unknown as AutopilotConfig;
      setConfigTopic(cfg.default_topic || '');
      setConfigSources((cfg.default_sources || []).join('\n'));
    }
  }, [configData]);

  const saveConfig = useMutation({
    mutationFn: async () => {
      const config = {
        default_topic: configTopic.trim(),
        default_sources: configSources.split('\n').map(s => s.trim()).filter(Boolean),
      };

      if (configData?.id) {
        const { error } = await supabase
          .from('modules')
          .update({ module_config: config as any })
          .eq('id', configData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('modules')
          .insert([{ module_type: 'autopilot', module_config: config as any, enabled: true }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['autopilot-config'] });
      setConfigDirty(false);
      toast.success('Autopilot config saved');
    },
    onError: (e) => toast.error('Failed to save config', { description: e.message }),
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

  const runAction = useMutation({
    mutationFn: async ({ action, topic, sources }: { action: string; topic?: string; sources?: string[] }) => {
      const { data, error } = await supabase.functions.invoke('agent-autopilot', {
        body: { action, topic, sources },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agent-tasks'] });
      const labels: Record<string, string> = {
        research: 'Research started',
        blog_draft: 'Blog draft created',
        newsletter_draft: 'Newsletter draft created',
      };
      toast.success(labels[variables.action] || 'Task completed', {
        description: data.title || data.subject || data.analysis?.substring(0, 100),
      });
    },
    onError: (error) => {
      toast.error('Autopilot failed', { description: error.message });
    },
  });

  const handleResearch = () => {
    if (!topic.trim()) return toast.error('Enter a topic');
    const sourceList = sources.split('\n').map(s => s.trim()).filter(Boolean);
    runAction.mutate({ action: 'research', topic: topic.trim(), sources: sourceList });
  };

  const handleBlogDraft = () => {
    if (!topic.trim()) return toast.error('Enter a topic');
    const sourceList = sources.split('\n').map(s => s.trim()).filter(Boolean);
    runAction.mutate({ action: 'blog_draft', topic: topic.trim(), sources: sourceList });
  };

  const handleNewsletterDraft = () => {
    runAction.mutate({ action: 'newsletter_draft' });
  };

  const isRunning = runAction.isPending;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Autopilot</h1>
        <p className="text-muted-foreground">Autonomous content research and generation</p>
      </div>

      {/* Scheduled Defaults Config */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings2 className="h-5 w-5" />
            Scheduled Defaults
          </CardTitle>
          <CardDescription>Default topic and sources used by the daily cron job when no specific topic is provided</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Default Research Topic</label>
            <Input
              placeholder="e.g. AI agents, agentic web, digital twins trends"
              value={configTopic}
              onChange={(e) => { setConfigTopic(e.target.value); setConfigDirty(true); }}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Default Sources</label>
            <textarea
              className="w-full px-3 py-2 rounded-md border bg-background text-sm min-h-[80px] resize-y"
              placeholder="One URL per line&#10;https://news.ycombinator.com&#10;https://arxiv.org/list/cs.AI/recent"
              value={configSources}
              onChange={(e) => { setConfigSources(e.target.value); setConfigDirty(true); }}
            />
          </div>
          <Button
            onClick={() => saveConfig.mutate()}
            disabled={!configDirty || saveConfig.isPending}
            size="sm"
          >
            {saveConfig.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
            Save Defaults
          </Button>
        </CardContent>
      </Card>

      {/* Action Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bot className="h-5 w-5" />
              New Task
            </CardTitle>
            <CardDescription>Research a topic, draft a blog post, or curate a newsletter</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Topic, e.g. 'Agentic AI trends 2026'"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isRunning}
            />
            <textarea
              className="w-full px-3 py-2 rounded-md border bg-background text-sm min-h-[80px] resize-y"
              placeholder="Sources (one URL per line, optional)&#10;https://news.ycombinator.com&#10;https://arxiv.org/list/cs.AI/recent"
              value={sources}
              onChange={(e) => setSources(e.target.value)}
              disabled={isRunning}
            />
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleResearch} disabled={isRunning || !topic.trim()} variant="outline" size="sm">
                {isRunning ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Search className="h-4 w-4 mr-1.5" />}
                Research
              </Button>
              <Button onClick={handleBlogDraft} disabled={isRunning || !topic.trim()} size="sm">
                {isRunning ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <PenSquare className="h-4 w-4 mr-1.5" />}
                Draft Blog Post
              </Button>
              <Button onClick={handleNewsletterDraft} disabled={isRunning} variant="outline" size="sm">
                {isRunning ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Mail className="h-4 w-4 mr-1.5" />}
                Draft Newsletter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Total Tasks', value: tasks.length },
              { label: 'Needs Review', value: tasks.filter(t => t.status === 'needs_review').length },
              { label: 'Blog Drafts', value: tasks.filter(t => t.task_type === 'blog_draft').length },
              { label: 'Research', value: tasks.filter(t => t.task_type === 'research').length },
            ].map(stat => (
              <div key={stat.label} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{stat.label}</span>
                <span className="font-semibold">{stat.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Task History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Task History</CardTitle>
            <CardDescription>Recent autonomous agent activity</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={() => queryClient.invalidateQueries({ queryKey: ['agent-tasks'] })}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No tasks yet. Start by researching a topic above.</p>
          ) : (
            <div className="space-y-2">
              {tasks.map(task => {
                const status = statusConfig[task.status] || statusConfig.pending;
                const type = taskTypeLabels[task.task_type] || taskTypeLabels.research;
                const StatusIcon = status.icon;
                const TypeIcon = type.icon;
                const inputData = task.input_data || {};
                const outputData = task.output_data || {};

                return (
                  <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors">
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
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
