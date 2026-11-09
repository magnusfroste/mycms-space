// ============================================
// Review queue — everything Autopilot proposed that waits for a decision.
// Same semantics as the MCP tool `review_decide`, so an operator and the
// owner can share the queue.
// ============================================

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { MarkdownContent } from '@/components/common';
import { useBlogPostById } from '@/models/blog';
import { TaskPreview } from '@/components/admin/autopilot/TaskHistoryItem';
import { AdminPageHeader } from '@/components/admin/shell/AdminPageHeader';
import {
  AdminLink,
  Chip,
  EmptyState,
  Eyebrow,
  Panel,
  Segmented,
  tableStyles as t,
} from '@/components/admin/shell/primitives';
import {
  taskSource,
  taskSummary,
  taskTitle,
  taskTypeLabel,
  useDecideTasks,
  usePendingApprovals,
  useResolveApproval,
  useReviewTasks,
  type AgentTask,
} from '@/components/admin/review/reviewData';
import { cn } from '@/lib/utils';

const approveHint: Record<string, string> = {
  blog_draft: 'Approving publishes the post. Rejecting archives it.',
  newsletter_draft: 'Approving marks the campaign ready — send it from Newsletter. Rejecting discards the draft.',
};

function BlogDraftBody({ postId }: { postId: string }) {
  const { data: post, isLoading } = useBlogPostById(postId);
  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (!post) return <p className="text-[13px] text-muted-foreground">The linked post could not be found.</p>;
  return (
    <div className="space-y-3">
      {post.cover_image_url && (
        <img src={post.cover_image_url} alt="" className="aspect-[16/9] w-full rounded-lg border border-border object-cover" />
      )}
      <h3 className="text-lg font-semibold leading-snug">{post.title}</h3>
      {post.excerpt && <p className="text-[13.5px] italic text-muted-foreground">{post.excerpt}</p>}
      <div className="border-t border-border pt-3 text-[13.5px]">
        <MarkdownContent content={post.content || ''} compact />
      </div>
    </div>
  );
}

function NewsletterDraftBody({ campaignId }: { campaignId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['newsletter-campaign', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('newsletter_campaigns')
        .select('subject, content, status')
        .eq('id', campaignId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (!data) return <p className="text-[13px] text-muted-foreground">The linked campaign could not be found.</p>;
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold leading-snug">{data.subject}</h3>
      <div className="border-t border-border pt-3 text-[13.5px]">
        <MarkdownContent content={data.content || ''} compact />
      </div>
    </div>
  );
}

function ReviewDrawer({
  task,
  onClose,
  onDecide,
  pending,
}: {
  task: AgentTask | null;
  onClose: () => void;
  onDecide: (task: AgentTask, decision: 'approve' | 'reject', note: string) => void;
  pending: boolean;
}) {
  const [note, setNote] = useState('');
  const o = task?.output_data || {};
  const postId = o.blog_post_id as string | undefined;
  const campaignId = o.campaign_id as string | undefined;

  return (
    <Sheet open={!!task} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        {task && (
          <>
            <SheetHeader className="space-y-1 border-b border-border px-6 py-5 text-left">
              <div className="flex items-center gap-2">
                <Chip>{taskTypeLabel(task.task_type)}</Chip>
                {typeof o.review_score === 'number' && <Chip mono>score {o.review_score as number}</Chip>}
              </div>
              <SheetTitle className="text-base font-semibold leading-snug">{taskTitle(task)}</SheetTitle>
              <SheetDescription className="text-[12.5px]">
                {taskSource(task)} · created {format(new Date(task.created_at), 'd MMM yyyy, HH:mm')}
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              {task.task_type === 'blog_draft' && postId ? (
                <BlogDraftBody postId={postId} />
              ) : task.task_type === 'newsletter_draft' && campaignId ? (
                <NewsletterDraftBody campaignId={campaignId} />
              ) : (
                <TaskPreview task={task} />
              )}
            </div>
            <div className="space-y-3 border-t border-border bg-muted/30 px-6 py-4">
              <p className="text-[12.5px] text-muted-foreground">
                {approveHint[task.task_type] ?? 'Approving marks it done. Rejecting tells Autopilot it was not useful.'}
              </p>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional note (stored with the decision)"
                className="min-h-[60px] bg-background text-[13px]"
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" disabled={pending} onClick={() => onDecide(task, 'approve', note)}>
                  {task.task_type === 'blog_draft' ? 'Approve & publish' : 'Approve'}
                </Button>
                <Button size="sm" variant="outline" disabled={pending} onClick={() => onDecide(task, 'reject', note)}>
                  Reject
                </Button>
                {task.task_type === 'blog_draft' && postId && (
                  <AdminLink view="blog" extra={{ editPostId: postId }} className="ml-auto">
                    Edit in Blog →
                  </AdminLink>
                )}
                {task.task_type === 'newsletter_draft' && (
                  <AdminLink view="newsletter" className="ml-auto">
                    Open Newsletter →
                  </AdminLink>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function SkillApprovals() {
  const { data: approvals = [] } = usePendingApprovals();
  const resolve = useResolveApproval();
  if (approvals.length === 0) return null;
  return (
    <Panel
      title="Skill calls waiting for permission"
      description="Some skills are marked “requires approval”. Approving runs the skill with the arguments shown."
    >
      <ul>
        {approvals.map((a, i) => {
          const input = (a.input ?? {}) as Record<string, unknown>;
          const args = (input.arguments as Record<string, unknown>) || input;
          return (
            <li key={a.id} className={cn('flex flex-wrap items-start gap-3 px-[18px] py-3.5', i > 0 && 'border-t border-border/70')}>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[13px] font-medium">{a.skill_name}</p>
                <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                  {a.agent} · {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                </p>
                {Object.keys(args).length > 0 && (
                  <pre className="mt-2 max-h-28 overflow-auto rounded-md bg-muted p-2 font-mono text-[11px]">
                    {JSON.stringify(args, null, 2)}
                  </pre>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="h-8"
                  disabled={resolve.isPending}
                  onClick={() =>
                    resolve.mutate(
                      { activity: a, approved: true },
                      { onSuccess: () => toast.success('Approved and run'), onError: (e) => toast.error((e as Error).message) },
                    )
                  }
                >
                  Approve & run
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8"
                  disabled={resolve.isPending}
                  onClick={() =>
                    resolve.mutate(
                      { activity: a, approved: false },
                      { onSuccess: () => toast.success('Rejected'), onError: (e) => toast.error((e as Error).message) },
                    )
                  }
                >
                  Reject
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

export default function ReviewQueueView() {
  const { data: tasks = [], isLoading } = useReviewTasks();
  const decide = useDecideTasks();
  const [typeFilter, setTypeFilter] = useState('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<AgentTask | null>(null);

  const types = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const task of tasks) counts[task.task_type] = (counts[task.task_type] ?? 0) + 1;
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [tasks]);

  const visible = typeFilter === 'all' ? tasks : tasks.filter((x) => x.task_type === typeFilter);
  const selectedVisible = visible.filter((x) => selected.has(x.id));
  const allSelected = visible.length > 0 && selectedVisible.length === visible.length;

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const run = (list: AgentTask[], decision: 'approve' | 'reject', note?: string) =>
    decide.mutate(
      { tasks: list, decision, note },
      {
        onSuccess: () => {
          toast.success(
            `${list.length === 1 ? '1 item' : `${list.length} items`} ${decision === 'approve' ? 'approved' : 'rejected'}`,
          );
          setSelected((prev) => {
            const next = new Set(prev);
            list.forEach((x) => next.delete(x.id));
            return next;
          });
          setOpen(null);
        },
        onError: (e) => toast.error(`Could not ${decision}: ${(e as Error).message}`),
      },
    );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Review queue"
        description="Work Autopilot proposed and an operator has not decided on yet. Nothing here is public until it is approved."
      />

      <Panel
        title={`${tasks.length} waiting`}
        description={tasks.length > 0 ? 'Open an item to read it in full before you decide.' : undefined}
        actions={
          types.length > 1 ? (
            <Segmented
              label="Filter by type"
              value={typeFilter}
              onChange={(v) => {
                setTypeFilter(v);
                setSelected(new Set());
              }}
              options={[
                { value: 'all', label: `All · ${tasks.length}` },
                ...types.map(([type, n]) => ({ value: type, label: `${taskTypeLabel(type)} · ${n}` })),
              ]}
            />
          ) : undefined
        }
      >
        {selectedVisible.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 border-b border-border bg-muted/40 px-[18px] py-2.5 text-[13px]">
            <span className="font-medium">{selectedVisible.length} selected</span>
            <Button size="sm" variant="outline" className="h-7" disabled={decide.isPending} onClick={() => run(selectedVisible, 'reject')}>
              Reject selected
            </Button>
            <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => setSelected(new Set())}>
              Clear
            </button>
          </div>
        )}
        {isLoading ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : visible.length === 0 ? (
          <EmptyState title="Nothing waiting for review">
            Blog drafts, newsletter drafts, research and signals that Autopilot produces land here. Autopilot stops
            producing new drafts while the queue is full, and old drafts expire on their own — see the guardrails on{' '}
            <AdminLink view="agents" className="text-[13px]">Operators &amp; Autopilot</AdminLink>.
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className={t.table}>
              <thead>
                <tr className={t.headRow}>
                  <th scope="col" className={`${t.th} w-10 pr-0`}>
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(c) => setSelected(c ? new Set(visible.map((x) => x.id)) : new Set())}
                      aria-label="Select all"
                    />
                  </th>
                  <th scope="col" className={t.th}>Item</th>
                  <th scope="col" className={t.th}>Type</th>
                  <th scope="col" className={t.th}>Source</th>
                  <th scope="col" className={t.th}>Created</th>
                  <th scope="col" className={`${t.th} text-right`}>Decision</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((task) => {
                  const summary = taskSummary(task);
                  return (
                    <tr
                      key={task.id}
                      className={cn(t.row, 'cursor-pointer transition-colors hover:bg-muted/40', selected.has(task.id) && 'bg-muted/30')}
                      onClick={() => setOpen(task)}
                    >
                      <td className={`${t.td} w-10 pr-0`} onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selected.has(task.id)}
                          onCheckedChange={() => toggle(task.id)}
                          aria-label={`Select ${taskTitle(task)}`}
                        />
                      </td>
                      <td className={`${t.td} max-w-[420px]`}>
                        <p className="truncate font-medium">{taskTitle(task)}</p>
                        {summary && <p className="mt-0.5 truncate text-[12.5px] text-muted-foreground">{summary}</p>}
                      </td>
                      <td className={t.td}>
                        <Chip>{taskTypeLabel(task.task_type)}</Chip>
                      </td>
                      <td className={`${t.td} text-foreground/80`}>{taskSource(task)}</td>
                      <td className={`${t.td} whitespace-nowrap text-foreground/80`} title={format(new Date(task.created_at), 'PPpp')}>
                        {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                      </td>
                      <td className={`${t.td} text-right`} onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1.5">
                          <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs" onClick={() => setOpen(task)}>
                            Open
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2.5 text-xs text-muted-foreground hover:text-destructive"
                            disabled={decide.isPending}
                            onClick={() => run([task], 'reject')}
                          >
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <SkillApprovals />

      <div className="rounded-xl border border-border bg-muted/30 px-[18px] py-4">
        <Eyebrow>How decisions work</Eyebrow>
        <p className="mt-1.5 text-[13px] leading-relaxed text-foreground/80">
          Approving a blog draft publishes it; rejecting archives it. Newsletter drafts are never sent from here — approve
          them, then send from Newsletter. Operators with the <span className="font-mono text-xs">review</span> scope make the
          same decisions through MCP (<span className="font-mono text-xs">review_decide</span>), and every decision is
          kept with the task.
        </p>
      </div>

      <ReviewDrawer
        key={open?.id ?? 'closed'}
        task={open}
        onClose={() => setOpen(null)}
        pending={decide.isPending}
        onDecide={(task, decision, note) => run([task], decision, note)}
      />
    </div>
  );
}
