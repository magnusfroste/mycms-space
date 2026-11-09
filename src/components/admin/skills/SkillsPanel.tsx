import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SkillCard } from '@/components/admin/skills/SkillCard';
import { SkillEditorSheet } from '@/components/admin/skills/SkillEditorSheet';
import { useDeleteSkill, useSkills, useToggleSkill, useUpsertSkill } from '@/hooks/useSkillHub';
import type { AgentSkill } from '@/types/agent';

/** The skills Autopilot (and operators, depending on scope) can call. */
export function SkillsPanel() {
  const { data: skills = [], isLoading } = useSkills();
  const toggle = useToggleSkill();
  const upsert = useUpsertSkill();
  const remove = useDeleteSkill();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<AgentSkill | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [scopeFilter, setScopeFilter] = useState('all');

  const filtered = useMemo(
    () =>
      skills.filter(
        (s) =>
          (categoryFilter === 'all' || s.category === categoryFilter) &&
          (scopeFilter === 'all' || s.scope === scopeFilter),
      ),
    [skills, categoryFilter, scopeFilter],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="h-8 w-40 text-[13px]"><SelectValue placeholder="Category" /></SelectTrigger>
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
          <SelectTrigger className="h-8 w-36 text-[13px]"><SelectValue placeholder="Scope" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All scopes</SelectItem>
            <SelectItem value="internal">Internal</SelectItem>
            <SelectItem value="external">External</SelectItem>
            <SelectItem value="both">Both</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-[12.5px] text-muted-foreground">{skills.length} skills</span>
        <div className="flex-1" />
        <Button onClick={() => { setEditingSkill(null); setEditorOpen(true); }} size="sm" className="h-8 gap-1.5">
          <Plus className="h-3.5 w-3.5" /> New skill
        </Button>
      </div>

      {isLoading ? (
        <p className="py-8 text-center text-[13px] text-muted-foreground">Loading skills…</p>
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-[13px] text-muted-foreground">No skills found.</p>
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
