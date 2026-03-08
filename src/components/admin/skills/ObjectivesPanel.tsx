import { useState, useEffect } from 'react';
import { Plus, Target, Trash2, CheckCircle2, PauseCircle, XCircle, Play, ListChecks, Circle, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useObjectives, useUpsertObjective, useDeleteObjective, useUpdateObjectiveStatus } from '@/hooks/useObjectives';
import type { AgentObjective, AgentObjectiveStatus } from '@/types/agent';

const statusConfig: Record<AgentObjectiveStatus, { label: string; color: string; icon: typeof Target }> = {
  active: { label: 'Active', color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400', icon: Play },
  paused: { label: 'Paused', color: 'bg-amber-500/15 text-amber-700 dark:text-amber-400', icon: PauseCircle },
  completed: { label: 'Completed', color: 'bg-blue-500/15 text-blue-700 dark:text-blue-400', icon: CheckCircle2 },
  failed: { label: 'Failed', color: 'bg-red-500/15 text-red-700 dark:text-red-400', icon: XCircle },
};

const stepStatusIcon: Record<string, { icon: typeof Circle; className: string }> = {
  pending: { icon: Circle, className: 'text-muted-foreground' },
  running: { icon: Loader2, className: 'text-amber-500 animate-spin' },
  done: { icon: CheckCircle2, className: 'text-emerald-500' },
  failed: { icon: AlertCircle, className: 'text-destructive' },
};

function deriveProgress(progress: Record<string, unknown>): number | null {
  // Plan-based progress
  const plan = progress?.plan as any;
  if (plan?.steps?.length) {
    const done = plan.steps.filter((s: any) => s.status === 'done').length;
    return Math.round((done / plan.steps.length) * 100);
  }
  const current = (progress.current ?? progress.done ?? progress.count) as number | undefined;
  const target = (progress.target ?? progress.total ?? progress.goal) as number | undefined;
  if (typeof current === 'number' && typeof target === 'number' && target > 0) return Math.min(Math.round((current / target) * 100), 100);
  return null;
}

function PlanSteps({ steps }: { steps: any[] }) {
  if (!steps?.length) return null;
  return (
    <div className="space-y-1 mt-3 pt-3 border-t border-border/40">
      <div className="flex items-center gap-1.5 mb-2">
        <ListChecks className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Plan</span>
      </div>
      {steps.map((step: any) => {
        const cfg = stepStatusIcon[step.status] || stepStatusIcon.pending;
        const StepIcon = cfg.icon;
        return (
          <div key={step.id} className="flex items-start gap-2 text-xs">
            <StepIcon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${cfg.className}`} />
            <span className={step.status === 'done' ? 'text-muted-foreground line-through' : 'text-foreground'}>
              {step.description}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function ObjectivesPanel() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AgentObjective | null>(null);

  const { data: objectives = [], isLoading } = useObjectives(statusFilter);
  const upsert = useUpsertObjective();
  const remove = useDeleteObjective();
  const updateStatus = useUpdateObjectiveStatus();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Button onClick={() => { setEditing(null); setEditorOpen(true); }} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> New Objective
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Loading objectives…</p>
      ) : objectives.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Target className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium">No objectives yet</p>
          <p className="text-sm mt-1">Define high-level goals for Magnet to work toward autonomously.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {objectives.map((obj) => {
            const cfg = statusConfig[obj.status];
            const StatusIcon = cfg.icon;
            const pct = deriveProgress(obj.progress);
            const plan = (obj.progress as any)?.plan;
            return (
              <Card key={obj.id} className="group cursor-pointer hover:ring-1 hover:ring-primary/20 transition-all" onClick={() => { setEditing(obj); setEditorOpen(true); }}>
                <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-1.5">
                        {(obj.progress as any)?.proposed_by === 'magnet' && (
                          <Sparkles className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-500" title="AI-proposed objective" />
                        )}
                        <CardTitle className="text-sm font-medium leading-snug line-clamp-2">{obj.goal}</CardTitle>
                      </div>
                      <Badge variant="secondary" className={`shrink-0 text-[10px] ${cfg.color}`}><StatusIcon className="h-3 w-3 mr-1" />{cfg.label}</Badge>
                    </div>
                    {(obj.progress as any)?.reason && (obj.progress as any)?.proposed_by === 'magnet' && (
                      <p className="text-[10px] text-muted-foreground mt-1 italic">💡 {(obj.progress as any).reason}</p>
                    )}
                </CardHeader>
                <CardContent className="space-y-2">
                  {pct !== null && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{plan ? `${plan.steps?.filter((s: any) => s.status === 'done').length}/${plan.total_steps} steps` : 'Progress'}</span>
                        <span>{pct}%</span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                  )}
                  {!plan && obj.status === 'active' && (
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <ListChecks className="h-3 w-3" />
                      <span>Awaiting plan decomposition…</span>
                    </div>
                  )}
                  {plan?.steps && <PlanSteps steps={plan.steps} />}
                  <div className="flex items-center justify-between pt-1" onClick={(e) => e.stopPropagation()}>
                    <Select value={obj.status} onValueChange={(v) => updateStatus.mutate({ id: obj.id, status: v })}>
                      <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Delete objective?</AlertDialogTitle><AlertDialogDescription>This will permanently remove this objective.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => remove.mutate(obj.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ObjectiveEditorSheet objective={editing} open={editorOpen} onClose={() => setEditorOpen(false)} onSave={(data) => upsert.mutate(data)} />
    </div>
  );
}

function ObjectiveEditorSheet({ objective, open, onClose, onSave }: { objective: AgentObjective | null; open: boolean; onClose: () => void; onSave: (data: Partial<AgentObjective> & { goal: string }) => void }) {
  const [goal, setGoal] = useState('');
  const [constraintsText, setConstraintsText] = useState('{}');
  const [criteriaText, setCriteriaText] = useState('{}');

  useEffect(() => {
    if (open) {
      setGoal(objective?.goal ?? '');
      setConstraintsText(objective?.constraints ? JSON.stringify(objective.constraints, null, 2) : '{}');
      setCriteriaText(objective?.success_criteria ? JSON.stringify(objective.success_criteria, null, 2) : '{}');
    }
  }, [open, objective]);

  const handleSave = () => {
    let constraints = {};
    let success_criteria = {};
    try { constraints = JSON.parse(constraintsText); } catch {}
    try { success_criteria = JSON.parse(criteriaText); } catch {}
    onSave({ ...(objective?.id ? { id: objective.id } : {}), goal, constraints, success_criteria, status: objective?.status ?? 'active', progress: objective?.progress ?? {} });
    onClose();
  };

  const plan = (objective?.progress as any)?.plan;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader><SheetTitle>{objective ? 'Edit Objective' : 'New Objective'}</SheetTitle></SheetHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2"><Label htmlFor="goal">Goal</Label><Textarea id="goal" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g. Publish 3 blog posts this week" rows={3} /></div>
          <div className="space-y-2"><Label>Constraints (JSON)</Label><Textarea value={constraintsText} onChange={(e) => setConstraintsText(e.target.value)} rows={4} className="font-mono text-xs" /><p className="text-xs text-muted-foreground">Guardrails: budgets, deadlines, excluded skills.</p></div>
          <div className="space-y-2"><Label>Success Criteria (JSON)</Label><Textarea value={criteriaText} onChange={(e) => setCriteriaText(e.target.value)} rows={4} className="font-mono text-xs" /><p className="text-xs text-muted-foreground">Measurable conditions for auto-completion.</p></div>
          {plan?.steps && (
            <div className="space-y-2">
              <Label>Execution Plan</Label>
              <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2">
                {plan.steps.map((step: any) => {
                  const cfg = stepStatusIcon[step.status] || stepStatusIcon.pending;
                  const StepIcon = cfg.icon;
                  return (
                    <div key={step.id} className="flex items-start gap-2.5 text-sm">
                      <StepIcon className={`h-4 w-4 mt-0.5 shrink-0 ${cfg.className}`} />
                      <div className="flex-1 min-w-0">
                        <p className={step.status === 'done' ? 'text-muted-foreground line-through' : ''}>{step.description}</p>
                        {step.skill_name && <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{step.skill_name}</p>}
                      </div>
                      <Badge variant="outline" className="text-[9px] shrink-0">{step.status}</Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <SheetFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={handleSave} disabled={!goal.trim()}>{objective ? 'Update' : 'Create'}</Button></SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
