import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Clock, CheckCircle, XCircle, ShieldCheck, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface A2ATask {
  id: string;
  status: string;
  input_data: {
    skill_id?: string;
    skill_name?: string;
    from_agent?: string;
    input?: Record<string, unknown>;
  };
  output_data: Record<string, unknown> | null;
  created_at: string;
  completed_at: string | null;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Clock }> = {
  pending: { label: 'Pending', variant: 'secondary', icon: Clock },
  pending_approval: { label: 'Awaiting Approval', variant: 'outline', icon: ShieldCheck },
  completed: { label: 'Completed', variant: 'default', icon: CheckCircle },
  failed: { label: 'Failed', variant: 'destructive', icon: XCircle },
};

export default function FederationPanel() {
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['a2a-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_tasks')
        .select('*')
        .eq('task_type', 'a2a_delegation')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as A2ATask[];
    },
    refetchInterval: 15000,
  });

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    pending: tasks.filter(t => t.status === 'pending' || t.status === 'pending_approval').length,
    failed: tasks.filter(t => t.status === 'failed').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Tasks', value: stats.total, color: 'text-foreground' },
          { label: 'Completed', value: stats.completed, color: 'text-green-500' },
          { label: 'Pending', value: stats.pending, color: 'text-yellow-500' },
          { label: 'Failed', value: stats.failed, color: 'text-destructive' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3 px-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Endpoint info */}
      <Card>
        <CardContent className="py-3 px-4 flex items-center gap-3 text-sm">
          <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">Discovery:</span>
          <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">/.well-known/agent.json</code>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">Negotiate:</span>
          <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">/a2a</code>
        </CardContent>
      </Card>

      {/* Task list */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Loading federation tasks…</p>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Globe className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No A2A tasks received yet.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Other agents can delegate tasks via the <code className="bg-muted px-1 rounded">/a2a</code> endpoint.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {tasks.map(task => {
            const cfg = statusConfig[task.status] || statusConfig.pending;
            const StatusIcon = cfg.icon;
            return (
              <Card key={task.id} className="overflow-hidden">
                <CardContent className="py-3 px-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">
                          {task.input_data?.skill_name || task.input_data?.skill_id || 'Unknown skill'}
                        </span>
                        <Badge variant={cfg.variant} className="text-[10px] gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {cfg.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>From: <strong>{task.input_data?.from_agent || 'unknown'}</strong></span>
                        <span>{formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Input preview */}
                  {task.input_data?.input && Object.keys(task.input_data.input).length > 0 && (
                    <details className="mt-2">
                      <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                        Input data
                      </summary>
                      <pre className="text-xs bg-muted rounded p-2 mt-1 overflow-x-auto max-h-32">
                        {JSON.stringify(task.input_data.input, null, 2)}
                      </pre>
                    </details>
                  )}

                  {/* Output preview */}
                  {task.output_data && Object.keys(task.output_data).length > 0 && (
                    <details className="mt-1">
                      <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                        Output data
                      </summary>
                      <pre className="text-xs bg-muted rounded p-2 mt-1 overflow-x-auto max-h-32">
                        {JSON.stringify(task.output_data, null, 2)}
                      </pre>
                    </details>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
