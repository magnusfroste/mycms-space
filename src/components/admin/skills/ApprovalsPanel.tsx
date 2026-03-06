import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { Check, X, Play, ShieldCheck, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { useActivity } from '@/hooks/useSkillHub';
import type { AgentActivity } from '@/types/agent';

export function ApprovalsPanel() {
  const { data: pending = [], isLoading } = useActivity({ status: 'pending_approval' });
  const { data: recent = [] } = useActivity({ status: undefined });
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Recently resolved (approved/rejected) — last 20
  const resolved = recent.filter(
    (a) => a.status === 'approved' || a.status === 'rejected'
  ).slice(0, 20);

  const approve = useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean }) => {
      const { error } = await supabase
        .from('agent_activity')
        .update({ status: approved ? 'approved' : 'rejected' } as any)
        .eq('id', id);
      if (error) throw error;

      // If approved, execute the skill via agent-execute
      if (approved) {
        const activity = pending.find((a) => a.id === id);
        if (activity) {
          const skillName = activity.skill_name;
          const args = (activity.input as any)?.arguments || activity.input || {};
          await supabase.functions.invoke('agent-execute', {
            body: {
              skill_name: skillName,
              arguments: args,
              agent_type: 'magnet',
            },
          });
        }
      }
    },
    onSuccess: (_, { approved }) => {
      queryClient.invalidateQueries({ queryKey: ['agent-activity'] });
      toast.success(approved ? 'Approved & executed' : 'Rejected');
    },
    onError: (e) => toast.error('Action failed', { description: e.message }),
  });

  if (isLoading) {
    return (
      <div className="text-center py-12 text-sm text-muted-foreground">
        Loading approvals…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending queue */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-medium">
            Pending Approval
            {pending.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {pending.length}
              </Badge>
            )}
          </h3>
        </div>

        {pending.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <ShieldCheck className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No pending approvals. All clear.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {pending.map((item) => (
              <ApprovalCard
                key={item.id}
                item={item}
                expanded={expandedId === item.id}
                onToggle={() =>
                  setExpandedId(expandedId === item.id ? null : item.id)
                }
                onApprove={() => approve.mutate({ id: item.id, approved: true })}
                onReject={() => approve.mutate({ id: item.id, approved: false })}
                isPending={approve.isPending}
              />
            ))}
          </div>
        )}
      </div>

      {/* Resolved history */}
      {resolved.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Recently Resolved
          </h3>
          <div className="space-y-1.5">
            {resolved.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 px-3 py-2 rounded-lg border bg-card text-sm"
              >
                {item.status === 'approved' ? (
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                ) : (
                  <X className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                )}
                <span className="font-mono text-xs truncate flex-1">
                  {item.skill_name?.replace(/_/g, ' ')}
                </span>
                <Badge
                  variant="outline"
                  className={
                    item.status === 'approved'
                      ? 'text-primary border-primary/20 text-[10px]'
                      : 'text-muted-foreground text-[10px]'
                  }
                >
                  {item.status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(item.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ApprovalCard({
  item,
  expanded,
  onToggle,
  onApprove,
  onReject,
  isPending,
}: {
  item: AgentActivity;
  expanded: boolean;
  onToggle: () => void;
  onApprove: () => void;
  onReject: () => void;
  isPending: boolean;
}) {
  const input = item.input as Record<string, any> | null;
  const automationId = input?.automation_id;
  const args = input?.arguments;

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0 animate-pulse" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">
            {item.skill_name?.replace(/_/g, ' ')}
          </p>
          <p className="text-xs text-muted-foreground">
            Requested{' '}
            {formatDistanceToNow(new Date(item.created_at), {
              addSuffix: true,
            })}
            {automationId && (
              <span> · automation {String(automationId).slice(0, 8)}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            size="sm"
            variant="default"
            className="h-7 px-3 gap-1 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onApprove();
            }}
            disabled={isPending}
          >
            <Play className="h-3 w-3" /> Approve & Run
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onReject();
            }}
            disabled={isPending}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="border-t px-4 py-3 bg-muted/30 space-y-2 animate-in slide-in-from-top-1 duration-150">
          {item.output && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                Reason
              </p>
              <p className="text-xs">
                {(item.output as any)?.reason || 'Skill requires admin approval'}
              </p>
            </div>
          )}
          {args && Object.keys(args).length > 0 && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                Arguments
              </p>
              <pre className="text-[11px] font-mono p-2 rounded bg-muted overflow-auto max-h-32">
                {JSON.stringify(args, null, 2)}
              </pre>
            </div>
          )}
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1">
            <span>Agent: {item.agent}</span>
            <span>
              Time: {format(new Date(item.created_at), 'MMM d, HH:mm:ss')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
