import { useState, useMemo, lazy, Suspense } from 'react';
import { Plus } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { SkillCard } from '@/components/admin/skills/SkillCard';
import { SkillEditorSheet } from '@/components/admin/skills/SkillEditorSheet';
import { ActivityTable } from '@/components/admin/skills/ActivityTable';
import { ObjectivesPanel } from '@/components/admin/skills/ObjectivesPanel';
import { AutomationsPanel } from '@/components/admin/skills/AutomationsPanel';
import { AutomationHealthPanel } from '@/components/admin/skills/AutomationHealthPanel';
import { ApprovalsPanel } from '@/components/admin/skills/ApprovalsPanel';
import { useSkills, useToggleSkill, useUpsertSkill, useDeleteSkill, useActivity } from '@/hooks/useSkillHub';
import type { AgentSkill } from '@/types/agent';

const OverviewPanel = lazy(() => import('@/components/admin/skills/OverviewPanel'));
const FederationPanel = lazy(() => import('@/components/admin/skills/FederationPanel'));

const TabFallback = () => (
  <div className="space-y-3 py-4">
    <Skeleton className="h-8 w-full" />
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-32 w-full" />
  </div>
);

export default function SkillHub() {
  const { data: skills = [], isLoading } = useSkills();
  const toggle = useToggleSkill();
  const upsert = useUpsertSkill();
  const remove = useDeleteSkill();
  const { data: pendingActivities = [] } = useActivity({ status: 'pending_approval' });
  const pendingCount = pendingActivities.length;

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<AgentSkill | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [scopeFilter, setScopeFilter] = useState('all');

  const filtered = useMemo(() => {
    return skills.filter((s) => {
      if (categoryFilter !== 'all' && s.category !== categoryFilter) return false;
      if (scopeFilter !== 'all' && s.scope !== scopeFilter) return false;
      return true;
    });
  }, [skills, categoryFilter, scopeFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agency</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage agent skills, automations, objectives, and monitor activity.
          </p>
        </div>
        <Badge variant="secondary" className="text-xs">{skills.length} skills</Badge>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="approvals" className="gap-1.5">
            Approvals
            {pendingCount > 0 && (
              <span className="inline-flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-medium min-w-[18px] h-[18px] px-1">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="objectives">Objectives</TabsTrigger>
          <TabsTrigger value="automations">Automations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Suspense fallback={<TabFallback />}>
            <OverviewPanel />
          </Suspense>
        </TabsContent>

        <TabsContent value="skills" className="space-y-4">
          <div className="flex items-center gap-3">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                <SelectItem value="content">Content</SelectItem>
                <SelectItem value="crm">CRM</SelectItem>
                <SelectItem value="communication">Communication</SelectItem>
                <SelectItem value="automation">Automation</SelectItem>
                <SelectItem value="search">Search</SelectItem>
                <SelectItem value="analytics">Analytics</SelectItem>
              </SelectContent>
            </Select>
            <Select value={scopeFilter} onValueChange={setScopeFilter}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Scope" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All scopes</SelectItem>
                <SelectItem value="internal">Internal</SelectItem>
                <SelectItem value="external">External</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex-1" />
            <Button onClick={() => { setEditingSkill(null); setEditorOpen(true); }} size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" /> New Skill
            </Button>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading skills…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No skills found.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((skill) => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  onToggle={(id, enabled) => toggle.mutate({ id, enabled })}
                  onEdit={(s) => { setEditingSkill(s); setEditorOpen(true); }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approvals"><ApprovalsPanel /></TabsContent>
        <TabsContent value="activity"><ActivityTable /></TabsContent>
        <TabsContent value="health"><AutomationHealthPanel /></TabsContent>
        <TabsContent value="objectives"><ObjectivesPanel /></TabsContent>
        <TabsContent value="automations"><AutomationsPanel /></TabsContent>
      </Tabs>

      <SkillEditorSheet
        skill={editingSkill}
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={(data) => upsert.mutate(data)}
        onDelete={(id) => remove.mutate(id)}
      />
    </div>
  );
}
