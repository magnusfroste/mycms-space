// ============================================
// Review queue data: agent_tasks waiting for review (status 'needs_review')
// plus skill calls waiting for approval (agent_activity 'pending_approval').
// ============================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { AgentActivity } from '@/types/agent';

export type AgentTask = {
  id: string;
  task_type: string;
  status: string;
  input_data: Record<string, unknown>;
  output_data: Record<string, unknown>;
  created_at: string;
  completed_at: string | null;
  batch_id?: string | null;
};

export const reviewKeys = {
  count: ['review-queue', 'count'] as const,
  tasks: ['review-queue', 'tasks'] as const,
};

export const taskTypeLabels: Record<string, string> = {
  research: 'Research',
  blog_draft: 'Blog draft',
  newsletter_draft: 'Newsletter',
  inbox_digest: 'Inbox digest',
  scout: 'Source scout',
  linkedin_post: 'LinkedIn post',
  x_thread: 'X thread',
  multichannel_draft: 'Multichannel brief',
  signal: 'Signal',
};

export const taskTypeLabel = (type: string) =>
  taskTypeLabels[type] ?? type.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

/** Best-effort title for a task, from whatever the producing skill stored. */
export const taskTitle = (task: AgentTask): string => {
  const o = task.output_data || {};
  const i = task.input_data || {};
  return (
    (o.title as string) ||
    (o.subject as string) ||
    (i.title as string) ||
    (o.topic as string) ||
    (i.topic as string) ||
    taskTypeLabel(task.task_type)
  );
};

/** One-line summary shown under the title. */
export const taskSummary = (task: AgentTask): string => {
  const o = task.output_data || {};
  const i = task.input_data || {};
  const raw =
    (o.excerpt as string) ||
    (o.research_summary as string) ||
    (o.analysis as string) ||
    (o.synthesis as string) ||
    (o.brief as string) ||
    (o.content as string) ||
    (i.note as string) ||
    (i.content as string) ||
    '';
  return raw.replace(/[#*_>`]/g, '').replace(/\s+/g, ' ').trim().slice(0, 160);
};

/** Where the task came from: the automation, the batch or a manual run. */
export const taskSource = (task: AgentTask): string => {
  const i = task.input_data || {};
  if (i.automation_name) return String(i.automation_name);
  if (i.source_type) return `Signal · ${String(i.source_type)}`;
  if (task.batch_id) return 'Multichannel batch';
  if (i.source) return String(i.source);
  return 'Autopilot';
};

export function useReviewCount() {
  return useQuery({
    queryKey: reviewKeys.count,
    queryFn: async () => {
      const [tasks, approvals] = await Promise.all([
        supabase.from('agent_tasks').select('id', { count: 'exact', head: true }).eq('status', 'needs_review'),
        supabase.from('agent_activity').select('id', { count: 'exact', head: true }).eq('status', 'pending_approval'),
      ]);
      return (tasks.count ?? 0) + (approvals.count ?? 0);
    },
    refetchInterval: 60_000,
  });
}

export function useReviewTasks() {
  return useQuery({
    queryKey: reviewKeys.tasks,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_tasks')
        .select('*')
        .eq('status', 'needs_review')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as AgentTask[];
    },
  });
}

export function usePendingApprovals() {
  return useQuery({
    queryKey: ['agent-activity', { status: 'pending_approval' }],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_activity')
        .select('*')
        .eq('status', 'pending_approval')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as AgentActivity[];
    },
  });
}

const invalidateReview = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ['review-queue'] });
  qc.invalidateQueries({ queryKey: ['agent-tasks'] });
  qc.invalidateQueries({ queryKey: ['agent-activity'] });
  qc.invalidateQueries({ queryKey: ['blog'] });
};

/**
 * Decide on review items — same semantics as the MCP tool `review_decide`:
 * approving a blog draft publishes the post, rejecting archives it;
 * newsletter drafts stay as draft campaigns (send them from Newsletter).
 * The decision is recorded in the task's output_data.
 */
async function decideTasks(tasks: AgentTask[], decision: 'approve' | 'reject', note?: string) {
  const approve = decision === 'approve';
  for (const task of tasks) {
    const out = task.output_data || {};
    if (task.task_type === 'blog_draft') {
      const postId = out.blog_post_id as string | undefined;
      const slug = out.slug as string | undefined;
      if (postId || slug) {
        const update = approve
          ? { status: 'published', published_at: new Date().toISOString() }
          : { status: 'archived' };
        const query = supabase.from('blog_posts').update(update);
        const { error } = postId ? await query.eq('id', postId) : await query.eq('slug', slug as string);
        if (error) throw error;
      } else if (approve) {
        throw new Error('This draft has no linked blog post');
      }
    }
    const { error } = await supabase
      .from('agent_tasks')
      .update({
        status: approve ? 'completed' : 'rejected',
        completed_at: new Date().toISOString(),
        output_data: { ...out, decision, decided_by: 'admin', decision_note: note?.trim() || null } as never,
      })
      .eq('id', task.id);
    if (error) throw error;
  }
}

export function useDecideTasks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tasks, decision, note }: { tasks: AgentTask[]; decision: 'approve' | 'reject'; note?: string }) =>
      decideTasks(tasks, decision, note),
    onSuccess: () => invalidateReview(qc),
  });
}

/** Approve or reject a skill call that asked for permission (same logic as the old Approvals tab). */
export function useResolveApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ activity, approved }: { activity: AgentActivity; approved: boolean }) => {
      const { error } = await supabase
        .from('agent_activity')
        .update({ status: approved ? 'approved' : 'rejected' } as never)
        .eq('id', activity.id);
      if (error) throw error;
      if (approved) {
        const input = (activity.input ?? {}) as Record<string, unknown>;
        const args = (input.arguments as Record<string, unknown>) || input;
        await supabase.functions.invoke('agent-execute', {
          body: { skill_name: activity.skill_name, arguments: args, agent_type: 'magnet' },
        });
      }
    },
    onSuccess: () => invalidateReview(qc),
  });
}
