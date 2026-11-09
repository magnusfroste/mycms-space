// ============================================
// Operators & Autopilot (see docs/redesign/Agents.dc.html)
// ============================================

import { lazy, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminPageHeader } from '@/components/admin/shell/AdminPageHeader';
import { SectionTabs } from '@/components/admin/shell/SectionTabs';
import { Panel } from '@/components/admin/shell/primitives';
import { OperatorsPanel } from '@/components/admin/agents/OperatorsPanel';
import { AutopilotPanel } from '@/components/admin/agents/AutopilotPanel';
import { SkillsPanel } from '@/components/admin/skills/SkillsPanel';
import { ObjectivesPanel } from '@/components/admin/skills/ObjectivesPanel';
import { AutomationsPanel } from '@/components/admin/skills/AutomationsPanel';
import { AutomationHealthPanel } from '@/components/admin/skills/AutomationHealthPanel';
import TaskHistoryItem from '@/components/admin/autopilot/TaskHistoryItem';
import type { AgentTask } from '@/components/admin/review/reviewData';
import { cn } from '@/lib/utils';

const DocumentsPanel = lazy(() => import('@/components/admin/skills/DocumentsPanel'));
const McpPanel = lazy(() => import('@/components/admin/skills/McpPanel'));

const roles = [
  {
    eyebrow: 'Decides',
    title: 'Operator',
    text: 'Hermes, Claude, ChatGPT or you in this admin. Reads everything, writes content, approves what Autopilot proposes. Connects with an MCP key.',
    strong: true,
  },
  {
    eyebrow: 'Maintains',
    title: 'Autopilot',
    text: 'Internal loop on a schedule: observe, plan, act, report. Keeps the blog pipeline, syncs and health checks going. Proposes; does not publish.',
  },
  {
    eyebrow: 'Talks',
    title: 'Magnet',
    text: 'Your public twin on the site. Answers from the knowledge base and hands serious leads to the inbox. Read-only.',
  },
];

/** Recent Autopilot runs, newest first, with the old publish shortcut for blog drafts. */
function RunsPanel() {
  const qc = useQueryClient();
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['agent-tasks', 'recent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_tasks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(40);
      if (error) throw error;
      return (data ?? []) as AgentTask[];
    },
  });
  const publish = useMutation({
    mutationFn: async (task: AgentTask) => {
      const o = task.output_data || {};
      const postId = o.blog_post_id as string | undefined;
      const query = supabase.from('blog_posts').update({ status: 'published', published_at: new Date().toISOString() });
      const { error } = postId ? await query.eq('id', postId) : await query.eq('slug', o.slug as string);
      if (error) throw error;
      await supabase
        .from('agent_tasks')
        .update({ status: 'completed', output_data: { ...o, decision: 'approve', decided_by: 'admin' } as never })
        .eq('id', task.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent-tasks'] });
      qc.invalidateQueries({ queryKey: ['review-queue'] });
      toast.success('Published');
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  return (
    <div className="space-y-2">
      {tasks.length === 0 ? (
        <p className="py-8 text-center text-[13px] text-muted-foreground">No runs yet.</p>
      ) : (
        tasks.map((task) => (
          <TaskHistoryItem key={task.id} task={task} onPublish={(t) => publish.mutate(t)} isPublishing={publish.isPending} />
        ))
      )}
    </div>
  );
}

const Lazy = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<Skeleton className="h-40 w-full" />}>{children}</Suspense>
);

export default function AgentsView({ section }: { section?: string }) {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Operators & Autopilot"
        description="Who runs the CMS. Operators steer through MCP and decide. Autopilot keeps things running between their visits and never publishes on its own. Magnet only talks to visitors."
      />

      <section aria-label="Roles" className="grid gap-3 md:grid-cols-3">
        {roles.map((r) => (
          <div
            key={r.title}
            className={cn('flex flex-col gap-2 rounded-xl border bg-card p-[18px]', r.strong ? 'border-foreground' : 'border-border')}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ring">{r.eyebrow}</p>
            <h2 className="text-[17px] font-semibold">{r.title}</h2>
            <p className="text-[13px] leading-relaxed text-foreground/80">{r.text}</p>
          </div>
        ))}
      </section>

      <OperatorsPanel />
      <AutopilotPanel />

      <Panel
        title="Under the hood"
        description="What Autopilot can do and how it is set up. Operators with the settings scope can change most of this through MCP."
        bodyClassName="px-[18px] pb-5"
      >
        <SectionTabs
          section={section}
          tabs={[
            { value: 'automations', label: 'Automations', content: <AutomationsPanel /> },
            { value: 'skills', label: 'Skills', content: <SkillsPanel /> },
            { value: 'objectives', label: 'Objectives', content: <ObjectivesPanel /> },
            { value: 'runs', label: 'Recent runs', content: <RunsPanel /> },
            { value: 'health', label: 'Health', content: <AutomationHealthPanel /> },
            { value: 'documents', label: 'Documents', content: <Lazy><DocumentsPanel /></Lazy> },
            { value: 'mcp', label: 'MCP server', content: <Lazy><McpPanel /></Lazy> },
          ]}
        />
      </Panel>
    </div>
  );
}
