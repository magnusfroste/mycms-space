import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Globe, Clock, CheckCircle, XCircle, ShieldCheck, ArrowRight,
  Play, Ban, Loader2, Plus, Pencil, Trash2, Wifi, WifiOff,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface FederationAgent {
  id: string;
  name: string;
  description: string;
  handler: string;
  tool_definition: Record<string, unknown> | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface AgentFormData {
  name: string;
  description: string;
  url: string;
  skill_id: string;
  api_token_key: string;
  enabled: boolean;
}

const emptyForm: AgentFormData = {
  name: '', description: '', url: '', skill_id: '', api_token_key: '', enabled: true,
};

// ─── Task Status Config ───────────────────────────────────────────────────────

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Clock }> = {
  pending: { label: 'Pending', variant: 'secondary', icon: Clock },
  pending_approval: { label: 'Awaiting Approval', variant: 'outline', icon: ShieldCheck },
  completed: { label: 'Completed', variant: 'default', icon: CheckCircle },
  failed: { label: 'Failed', variant: 'destructive', icon: XCircle },
  rejected: { label: 'Rejected', variant: 'destructive', icon: Ban },
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FederationPanel() {
  return (
    <div className="space-y-6">
      {/* Endpoint info */}
      <Card>
        <CardContent className="py-3 px-4 flex items-center gap-3 text-sm flex-wrap">
          <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">Discovery:</span>
          <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">/.well-known/agent.json</code>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">Negotiate:</span>
          <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">/a2a</code>
        </CardContent>
      </Card>

      <Tabs defaultValue="agents">
        <TabsList>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="tasks">Inbound Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="agents">
          <AgentsSection />
        </TabsContent>
        <TabsContent value="tasks">
          <TasksSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Agents Section ───────────────────────────────────────────────────────────

function AgentsSection() {
  const queryClient = useQueryClient();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<FederationAgent | null>(null);

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ['federation-agents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_skills')
        .select('*')
        .eq('scope', 'federation')
        .order('name');
      if (error) throw error;
      return (data || []) as unknown as FederationAgent[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('agent_skills').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Agent removed');
      queryClient.invalidateQueries({ queryKey: ['federation-agents'] });
    },
    onError: () => toast.error('Failed to remove agent'),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase.from('agent_skills').update({ enabled }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['federation-agents'] }),
    onError: () => toast.error('Failed to toggle agent'),
  });

  const openNew = () => { setEditingAgent(null); setEditorOpen(true); };
  const openEdit = (agent: FederationAgent) => { setEditingAgent(agent); setEditorOpen(true); };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          External agents Magnet can delegate tasks to via A2A.
        </p>
        <Button onClick={openNew} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> Add Agent
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
      ) : agents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Globe className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No federation agents registered yet.</p>
            <Button onClick={openNew} variant="outline" size="sm" className="mt-3 gap-1.5">
              <Plus className="h-4 w-4" /> Register an Agent
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {agents.map(agent => {
            const toolDef = (agent.tool_definition || {}) as Record<string, unknown>;
            const url = agent.handler.replace(/^a2a:/, '');
            return (
              <Card key={agent.id} className={!agent.enabled ? 'opacity-60' : ''}>
                <CardHeader className="pb-2 px-4 pt-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {agent.enabled ? (
                        <Wifi className="h-4 w-4 text-green-500 shrink-0" />
                      ) : (
                        <WifiOff className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <CardTitle className="text-sm truncate">{agent.name}</CardTitle>
                    </div>
                    <Switch
                      checked={agent.enabled}
                      onCheckedChange={(enabled) => toggleMutation.mutate({ id: agent.id, enabled })}
                    />
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-2">
                  {agent.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{agent.description}</p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[10px] font-mono">{toolDef.skill_id as string || '—'}</Badge>
                    <code className="text-[10px] text-muted-foreground truncate max-w-[200px]">{url}</code>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => openEdit(agent)}>
                      <Pencil className="h-3 w-3" /> Edit
                    </Button>
                    <Button
                      size="sm" variant="ghost"
                      className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm(`Remove ${agent.name}?`)) deleteMutation.mutate(agent.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" /> Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AgentEditorSheet
        agent={editingAgent}
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
      />
    </div>
  );
}

// ─── Agent Editor Sheet ───────────────────────────────────────────────────────

function AgentEditorSheet({ agent, open, onClose }: {
  agent: FederationAgent | null;
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const isEdit = !!agent;

  const toFormData = (a: FederationAgent | null): AgentFormData => {
    if (!a) return emptyForm;
    const toolDef = (a.tool_definition || {}) as Record<string, unknown>;
    return {
      name: a.name,
      description: a.description || '',
      url: a.handler.replace(/^a2a:/, ''),
      skill_id: (toolDef.skill_id as string) || '',
      api_token_key: (toolDef.api_token_key as string) || '',
      enabled: a.enabled,
    };
  };

  const [form, setForm] = useState<AgentFormData>(toFormData(agent));
  const [saving, setSaving] = useState(false);

  // Reset form when agent changes
  const currentAgentId = agent?.id || null;
  const [lastAgentId, setLastAgentId] = useState<string | null>(null);
  if (currentAgentId !== lastAgentId) {
    setLastAgentId(currentAgentId);
    setForm(toFormData(agent));
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.url.trim()) {
      toast.error('Name and URL are required');
      return;
    }
    if (!form.url.startsWith('http')) {
      toast.error('URL must start with http:// or https://');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        handler: `a2a:${form.url.trim()}`,
        scope: 'federation' as string,
        category: 'automation' as string,
        enabled: form.enabled,
        requires_approval: false,
        tool_definition: {
          skill_id: form.skill_id.trim() || undefined,
          api_token_key: form.api_token_key.trim() || undefined,
        },
      };

      if (isEdit && agent) {
        const { error } = await supabase.from('agent_skills').update(payload as any).eq('id', agent.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('agent_skills').insert(payload as any);
        if (error) throw error;
      }

      toast.success(isEdit ? 'Agent updated' : 'Agent registered');
      queryClient.invalidateQueries({ queryKey: ['federation-agents'] });
      queryClient.invalidateQueries({ queryKey: ['agent-skills'] });
      onClose();
    } catch (err) {
      toast.error(`Failed to save: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const update = (key: keyof AgentFormData, value: string | boolean) =>
    setForm(prev => ({ ...prev, [key]: value }));

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Edit Agent' : 'Register Agent'}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-6">
          <div className="space-y-1.5">
            <Label>Name *</Label>
            <Input
              placeholder="e.g. SoundSpace: Generate Track"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>A2A Endpoint URL *</Label>
            <Input
              placeholder="https://example.com/functions/v1/a2a-negotiate"
              value={form.url}
              onChange={(e) => update('url', e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">The remote agent's A2A negotiate endpoint.</p>
          </div>

          <div className="space-y-1.5">
            <Label>Skill ID</Label>
            <Input
              placeholder="e.g. generate_track"
              value={form.skill_id}
              onChange={(e) => update('skill_id', e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">The skill_id to send in the A2A task payload.</p>
          </div>

          <div className="space-y-1.5">
            <Label>API Token Key</Label>
            <Input
              placeholder="e.g. soundspace_a2a_key"
              value={form.api_token_key}
              onChange={(e) => update('api_token_key', e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">
              Key name in API Tokens module for the Bearer token. Leave empty if no auth needed.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              placeholder="What does this agent do?"
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Enabled</Label>
            <Switch checked={form.enabled} onCheckedChange={(v) => update('enabled', v)} />
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={saving} className="flex-1 gap-1.5">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? 'Update' : 'Register'}
            </Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Tasks Section (Inbound) ──────────────────────────────────────────────────

function TasksSection() {
  const queryClient = useQueryClient();

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

  const approve = useMutation({
    mutationFn: async (task: A2ATask) => {
      const res = await supabase.functions.invoke('agent-execute', {
        body: {
          skill_name: task.input_data.skill_name,
          arguments: task.input_data.input || {},
          agent_type: 'magnet',
          conversation_id: `a2a:${task.input_data.from_agent || 'unknown'}`,
        },
      });
      const result = res.data;
      const succeeded = result?.status === 'success';
      await supabase.from('agent_tasks').update({
        status: succeeded ? 'completed' : 'failed',
        output_data: result,
        completed_at: succeeded ? new Date().toISOString() : null,
      }).eq('id', task.id);
      if (!succeeded) throw new Error(result?.error || 'Execution failed');
      return result;
    },
    onSuccess: () => {
      toast.success('Task approved and executed');
      queryClient.invalidateQueries({ queryKey: ['a2a-tasks'] });
    },
    onError: (err) => {
      toast.error(`Execution failed: ${(err as Error).message}`);
      queryClient.invalidateQueries({ queryKey: ['a2a-tasks'] });
    },
  });

  const reject = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from('agent_tasks').update({
        status: 'rejected' as string,
        output_data: { reason: 'Manually rejected by admin' },
        completed_at: new Date().toISOString(),
      }).eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Task rejected');
      queryClient.invalidateQueries({ queryKey: ['a2a-tasks'] });
    },
  });

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    pending: tasks.filter(t => t.status === 'pending' || t.status === 'pending_approval').length,
    failed: tasks.filter(t => t.status === 'failed' || t.status === 'rejected').length,
  };

  const isPending = (status: string) => status === 'pending_approval' || status === 'pending';

  return (
    <div className="space-y-4 mt-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-foreground' },
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

      {/* Task list */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Globe className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No A2A tasks received yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {tasks.map(task => {
            const cfg = statusConfig[task.status] || statusConfig.pending;
            const StatusIcon = cfg.icon;
            const actionable = isPending(task.status);
            return (
              <Card key={task.id} className={actionable ? 'border-yellow-500/30' : ''}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">
                          {task.input_data?.skill_name || task.input_data?.skill_id || 'Unknown'}
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

                    {actionable && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          size="sm" variant="default" className="h-7 text-xs gap-1"
                          disabled={approve.isPending}
                          onClick={() => approve.mutate(task)}
                        >
                          {approve.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                          Approve
                        </Button>
                        <Button
                          size="sm" variant="outline" className="h-7 text-xs gap-1"
                          disabled={reject.isPending}
                          onClick={() => reject.mutate(task.id)}
                        >
                          <Ban className="h-3 w-3" /> Reject
                        </Button>
                      </div>
                    )}
                  </div>

                  {task.input_data?.input && Object.keys(task.input_data.input).length > 0 && (
                    <details className="mt-2">
                      <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">Input</summary>
                      <pre className="text-xs bg-muted rounded p-2 mt-1 overflow-x-auto max-h-32">
                        {JSON.stringify(task.input_data.input, null, 2)}
                      </pre>
                    </details>
                  )}
                  {task.output_data && Object.keys(task.output_data).length > 0 && (
                    <details className="mt-1">
                      <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">Output</summary>
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
