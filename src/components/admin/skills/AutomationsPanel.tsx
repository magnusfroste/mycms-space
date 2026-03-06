import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Plus, Timer, Zap, Radio, Trash2, AlertCircle, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAutomations, useUpsertAutomation, useToggleAutomation, useDeleteAutomation } from '@/hooks/useAutomations';
import { useSkills } from '@/hooks/useSkillHub';
import { useObjectives } from '@/hooks/useObjectives';
import type { AgentAutomation, AutomationTriggerType } from '@/types/agent';

const triggerConfig: Record<AutomationTriggerType, { label: string; icon: typeof Timer; color: string }> = {
  cron: { label: 'Cron', icon: Timer, color: 'bg-violet-500/15 text-violet-700 dark:text-violet-400' },
  event: { label: 'Event', icon: Zap, color: 'bg-amber-500/15 text-amber-700 dark:text-amber-400' },
  signal: { label: 'Signal', icon: Radio, color: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400' },
};

export function AutomationsPanel() {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AgentAutomation | null>(null);
  const { data: automations = [], isLoading } = useAutomations();
  const { data: objectives = [] } = useObjectives('active');
  const upsert = useUpsertAutomation();
  const toggle = useToggleAutomation();
  const remove = useDeleteAutomation();

  const objectiveMap = new Map(objectives.map(o => [o.id, o.goal]));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{automations.filter(a => a.enabled).length} active</span>
          <span>·</span>
          <span>{automations.length} total</span>
        </div>
        <div className="flex-1" />
        <Button onClick={() => { setEditing(null); setEditorOpen(true); }} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> New Automation
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Loading automations…</p>
      ) : automations.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Timer className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium">No automations yet</p>
          <p className="text-sm mt-1">Schedule skills to run on a cron, react to events, or respond to signals.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {automations.map((auto) => {
            const cfg = triggerConfig[auto.trigger_type];
            const TriggerIcon = cfg.icon;
            const cronExpr = auto.trigger_type === 'cron' ? (auto.trigger_config as any)?.expression : null;
            const linkedGoal = auto.objective_id ? objectiveMap.get(auto.objective_id) : null;

            return (
              <Card key={auto.id} className="group cursor-pointer hover:ring-1 hover:ring-primary/20 transition-all" onClick={() => { setEditing(auto); setEditorOpen(true); }}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-medium leading-snug line-clamp-2">{auto.name}</CardTitle>
                    <Badge variant="secondary" className={`shrink-0 text-[10px] ${cfg.color}`}><TriggerIcon className="h-3 w-3 mr-1" />{cfg.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {auto.description && <p className="text-xs text-muted-foreground line-clamp-2">{auto.description}</p>}
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="text-[10px] font-mono">{auto.skill_name}</Badge>
                    {cronExpr && <Badge variant="outline" className="text-[10px] font-mono">{cronExpr}</Badge>}
                  </div>
                  {linkedGoal && (
                    <div className="flex items-center gap-1.5 text-[10px] text-primary">
                      <Target className="h-3 w-3 shrink-0" />
                      <span className="truncate">{linkedGoal}</span>
                    </div>
                  )}
                  {auto.last_error && <div className="flex items-center gap-1 text-[10px] text-destructive"><AlertCircle className="h-3 w-3" /><span className="truncate">{auto.last_error}</span></div>}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{auto.run_count > 0 ? `${auto.run_count} runs · last ${auto.last_triggered_at ? format(new Date(auto.last_triggered_at), 'MMM d HH:mm') : '—'}` : 'Never run'}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <Switch checked={auto.enabled} onCheckedChange={(checked) => toggle.mutate({ id: auto.id, enabled: checked })} />
                      <span className="text-xs text-muted-foreground">{auto.enabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></AlertDialogTrigger>
                      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete automation?</AlertDialogTitle><AlertDialogDescription>This will permanently remove this automation trigger.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => remove.mutate(auto.id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AutomationEditorSheet automation={editing} open={editorOpen} onClose={() => setEditorOpen(false)} onSave={(data) => upsert.mutate(data)} />
    </div>
  );
}

function AutomationEditorSheet({ automation, open, onClose, onSave }: { automation: AgentAutomation | null; open: boolean; onClose: () => void; onSave: (data: Partial<AgentAutomation> & { name: string }) => void }) {
  const { data: skills = [] } = useSkills();
  const { data: objectives = [] } = useObjectives('active');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState<AutomationTriggerType>('cron');
  const [cronExpression, setCronExpression] = useState('');
  const [eventName, setEventName] = useState('');
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [selectedObjectiveId, setSelectedObjectiveId] = useState('');
  const [argsText, setArgsText] = useState('{}');

  useEffect(() => {
    if (open) {
      setName(automation?.name ?? '');
      setDescription(automation?.description ?? '');
      setTriggerType(automation?.trigger_type ?? 'cron');
      const tc = automation?.trigger_config ?? {};
      setCronExpression((tc as any).expression ?? '');
      setEventName((tc as any).event_name ?? '');
      setSelectedSkillId(automation?.skill_id ?? '');
      setSelectedObjectiveId(automation?.objective_id ?? '');
      setArgsText(automation?.skill_arguments ? JSON.stringify(automation.skill_arguments, null, 2) : '{}');
    }
  }, [open, automation]);

  const selectedSkill = skills.find(s => s.id === selectedSkillId);

  const handleSave = () => {
    let trigger_config: Record<string, unknown> = {};
    if (triggerType === 'cron') trigger_config = { expression: cronExpression };
    else if (triggerType === 'event') trigger_config = { event_name: eventName };

    let skill_arguments = {};
    try { skill_arguments = JSON.parse(argsText); } catch {}

    onSave({
      ...(automation?.id ? { id: automation.id } : {}),
      name, description: description || null,
      trigger_type: triggerType, trigger_config,
      skill_id: selectedSkillId || null,
      skill_name: selectedSkill?.name ?? '',
      skill_arguments,
      objective_id: selectedObjectiveId || null,
      enabled: automation?.enabled ?? true,
    });
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader><SheetTitle>{automation ? 'Edit Automation' : 'New Automation'}</SheetTitle></SheetHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Weekly analytics digest" /></div>
          <div className="space-y-2"><Label>Description</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" /></div>

          <div className="space-y-2">
            <Label>Linked Objective</Label>
            <Select value={selectedObjectiveId} onValueChange={setSelectedObjectiveId}>
              <SelectTrigger><SelectValue placeholder="None (standalone)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (standalone)</SelectItem>
                {objectives.map(o => (
                  <SelectItem key={o.id} value={o.id}>
                    <span className="flex items-center gap-1.5"><Target className="h-3 w-3 text-primary shrink-0" /><span className="truncate">{o.goal}</span></span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Link to an objective so Magnet tracks progress automatically.</p>
          </div>

          <div className="space-y-2">
            <Label>Trigger Type</Label>
            <Select value={triggerType} onValueChange={(v) => setTriggerType(v as AutomationTriggerType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cron"><span className="flex items-center gap-2"><Timer className="h-3.5 w-3.5" /> Cron Schedule</span></SelectItem>
                <SelectItem value="event"><span className="flex items-center gap-2"><Zap className="h-3.5 w-3.5" /> Event</span></SelectItem>
                <SelectItem value="signal"><span className="flex items-center gap-2"><Radio className="h-3.5 w-3.5" /> Signal</span></SelectItem>
              </SelectContent>
            </Select>
          </div>
          {triggerType === 'cron' && <div className="space-y-2"><Label>Cron Expression</Label><Input value={cronExpression} onChange={(e) => setCronExpression(e.target.value)} placeholder="0 9 * * 1 (every Monday 9am)" className="font-mono text-xs" /><p className="text-xs text-muted-foreground">Standard cron: minute hour day month weekday</p></div>}
          {triggerType === 'event' && <div className="space-y-2"><Label>Event Name</Label><Input value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="e.g. blog.published" className="font-mono text-xs" /></div>}
          <div className="space-y-2">
            <Label>Skill to Execute</Label>
            <Select value={selectedSkillId} onValueChange={setSelectedSkillId}>
              <SelectTrigger><SelectValue placeholder="Select a skill…" /></SelectTrigger>
              <SelectContent>{skills.filter(s => s.enabled).map(s => <SelectItem key={s.id} value={s.id}><span className="font-mono text-xs">{s.name}</span></SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Skill Arguments (JSON)</Label><Textarea value={argsText} onChange={(e) => setArgsText(e.target.value)} rows={4} className="font-mono text-xs" /></div>
        </div>
        <SheetFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={handleSave} disabled={!name.trim() || !selectedSkillId}>{automation ? 'Update' : 'Create'}</Button></SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
