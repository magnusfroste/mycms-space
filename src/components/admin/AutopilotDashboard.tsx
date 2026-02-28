import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Bot, Search, PenSquare, Mail, Loader2, RefreshCw, Settings2, Save, Radar } from 'lucide-react';
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
};

interface AutopilotConfig {
  default_topic: string;
  default_sources: string[];
}

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
        scout: 'Source discovery complete',
      };
      toast.success(labels[variables.action] || 'Task completed', {
        description: data.title || data.subject || data.synthesis?.substring(0, 100) || data.analysis?.substring(0, 100),
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

  const handleScout = () => {
    if (!topic.trim()) return toast.error('Enter a topic');
    runAction.mutate({ action: 'scout', topic: topic.trim() });
  };

  const isRunning = runAction.isPending;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Autopilot</h1>
        <p className="text-muted-foreground">Autonomous content research and generation</p>
      </div>

      {/* Workflow Visualizer */}
      <WorkflowVisualizer />

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
              {tasks.map(task => (
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
