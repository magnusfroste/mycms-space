import { useState } from 'react';
import { useGroupedResumeEntries, useCreateResumeEntry, useUpdateResumeEntry, useDeleteResumeEntry } from '@/models/resume';
import type { ResumeEntry, ResumeEntryInsert } from '@/models/resume';
import { useResumeModule, useUpdateResumeModule } from '@/models/modules';
import type { ResumeModuleConfig } from '@/types/modules';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, GripVertical, Briefcase, GraduationCap, Award, Code, Globe, User } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
  { id: 'experience', label: 'Experience', icon: Briefcase },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'certification', label: 'Certifications', icon: Award },
  { id: 'skill', label: 'Skills', icon: Code },
  { id: 'language', label: 'Languages', icon: Globe },
  { id: 'summary', label: 'Summary', icon: User },
];

interface EntryFormData {
  category: string;
  title: string;
  subtitle: string;
  description: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  tags: string;
  metadata: Record<string, unknown>;
  enabled: boolean;
}

const emptyForm = (category: string): EntryFormData => ({
  category,
  title: '',
  subtitle: '',
  description: '',
  start_date: '',
  end_date: '',
  is_current: false,
  tags: '',
  metadata: {},
  enabled: true,
});

const entryToForm = (e: ResumeEntry): EntryFormData => ({
  category: e.category,
  title: e.title,
  subtitle: e.subtitle || '',
  description: e.description || '',
  start_date: e.start_date || '',
  end_date: e.end_date || '',
  is_current: e.is_current,
  tags: (e.tags || []).join(', '),
  metadata: e.metadata || {},
  enabled: e.enabled,
});

const formToInsert = (f: EntryFormData, orderIndex: number): ResumeEntryInsert => ({
  category: f.category,
  title: f.title,
  subtitle: f.subtitle || null,
  description: f.description || null,
  start_date: f.start_date || null,
  end_date: f.end_date || null,
  is_current: f.is_current,
  tags: f.tags ? f.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
  metadata: f.metadata,
  order_index: orderIndex,
  enabled: f.enabled,
});

function ProfileCard() {
  const { config, isLoading } = useResumeModule();
  const updateModule = useUpdateResumeModule();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<ResumeModuleConfig>>({});

  const startEdit = () => {
    setForm(config || {});
    setEditing(true);
  };

  const save = () => {
    updateModule.mutate(
      { module_config: { ...config, ...form } as ResumeModuleConfig },
      {
        onSuccess: () => { toast.success('Profile updated'); setEditing(false); },
        onError: () => toast.error('Failed to update profile'),
      }
    );
  };

  if (isLoading) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Profile</CardTitle>
        {!editing && <Button variant="ghost" size="sm" onClick={startEdit}><Pencil className="h-3.5 w-3.5" /></Button>}
      </CardHeader>
      <CardContent className="space-y-3">
        {editing ? (
          <>
            <Input placeholder="Name" value={form.owner_name || ''} onChange={e => setForm(p => ({ ...p, owner_name: e.target.value }))} />
            <Input placeholder="Title" value={form.owner_title || ''} onChange={e => setForm(p => ({ ...p, owner_title: e.target.value }))} />
            <Textarea placeholder="Summary" value={form.owner_summary || ''} onChange={e => setForm(p => ({ ...p, owner_summary: e.target.value }))} rows={3} />
            <Input placeholder="Location" value={form.owner_location || ''} onChange={e => setForm(p => ({ ...p, owner_location: e.target.value }))} />
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Availability:</span>
              <select
                className="px-2 py-1 rounded border bg-background text-sm"
                value={form.owner_availability || 'available'}
                onChange={e => setForm(p => ({ ...p, owner_availability: e.target.value as ResumeModuleConfig['owner_availability'] }))}
              >
                <option value="available">Available</option>
                <option value="limited">Limited</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>
            <Input placeholder="Availability note" value={form.availability_note || ''} onChange={e => setForm(p => ({ ...p, availability_note: e.target.value }))} />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
              <Button size="sm" onClick={save} disabled={updateModule.isPending}>Save</Button>
            </div>
          </>
        ) : (
          <div className="space-y-1.5">
            <p className="font-medium">{config?.owner_name || 'Not set'}</p>
            <p className="text-sm text-muted-foreground">{config?.owner_title}</p>
            <p className="text-sm">{config?.owner_summary}</p>
            {config?.owner_location && <p className="text-xs text-muted-foreground">{config.owner_location}</p>}
            {config?.owner_availability && (
              <Badge variant={config.owner_availability === 'available' ? 'default' : 'secondary'}>
                {config.owner_availability}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EntryEditor({ category, entries }: { category: string; entries: ResumeEntry[] }) {
  const createEntry = useCreateResumeEntry();
  const updateEntry = useUpdateResumeEntry();
  const deleteEntry = useDeleteResumeEntry();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EntryFormData>(emptyForm(category));
  const [adding, setAdding] = useState(false);

  const isTimeline = ['experience', 'education'].includes(category);
  const isSkillLike = ['skill', 'language'].includes(category);

  const startAdd = () => {
    setForm(emptyForm(category));
    setAdding(true);
    setEditingId(null);
  };

  const startEdit = (entry: ResumeEntry) => {
    setForm(entryToForm(entry));
    setEditingId(entry.id);
    setAdding(false);
  };

  const cancel = () => { setAdding(false); setEditingId(null); };

  const handleSave = () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }

    if (adding) {
      createEntry.mutate(formToInsert(form, entries.length), {
        onSuccess: () => { toast.success('Entry added'); cancel(); },
        onError: () => toast.error('Failed to add entry'),
      });
    } else if (editingId) {
      const insert = formToInsert(form, entries.findIndex(e => e.id === editingId));
      updateEntry.mutate({ id: editingId, updates: insert as Partial<ResumeEntry> }, {
        onSuccess: () => { toast.success('Entry updated'); cancel(); },
        onError: () => toast.error('Failed to update entry'),
      });
    }
  };

  const handleDelete = (id: string) => {
    deleteEntry.mutate(id, {
      onSuccess: () => toast.success('Entry deleted'),
      onError: () => toast.error('Failed to delete'),
    });
  };

  const renderForm = () => (
    <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
      <Input placeholder="Title / Role" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
      <Input placeholder={isTimeline ? 'Company / Institution' : 'Subtitle'} value={form.subtitle} onChange={e => setForm(p => ({ ...p, subtitle: e.target.value }))} />
      <Textarea placeholder="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} />
      {isTimeline && (
        <div className="flex gap-2 items-center">
          <Input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} className="w-40" />
          <span className="text-muted-foreground text-sm">—</span>
          <Input type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} className="w-40" disabled={form.is_current} />
          <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Switch checked={form.is_current} onCheckedChange={v => setForm(p => ({ ...p, is_current: v }))} />
            Current
          </label>
        </div>
      )}
      {isSkillLike && (
        <Input
          type="number"
          placeholder="Level (0-100)"
          value={(form.metadata as Record<string, unknown>)?.level as string || ''}
          onChange={e => setForm(p => ({ ...p, metadata: { ...p.metadata, level: parseInt(e.target.value) || 0 } }))}
          className="w-32"
        />
      )}
      <Input placeholder="Tags (comma-separated)" value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} />
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={cancel}>Cancel</Button>
        <Button size="sm" onClick={handleSave} disabled={createEntry.isPending || updateEntry.isPending}>Save</Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {entries.map(entry => (
        editingId === entry.id ? (
          <div key={entry.id}>{renderForm()}</div>
        ) : (
          <div key={entry.id} className="flex items-start gap-3 p-3 border rounded-lg group hover:bg-muted/20 transition-colors">
            <GripVertical className="h-4 w-4 text-muted-foreground/40 mt-1 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{entry.title}</span>
                {!entry.enabled && <Badge variant="outline" className="text-xs">Hidden</Badge>}
                {isSkillLike && (entry.metadata as Record<string, unknown>)?.level && (
                  <Badge variant="secondary" className="text-xs">{String((entry.metadata as Record<string, unknown>).level)}%</Badge>
                )}
              </div>
              {entry.subtitle && <p className="text-sm text-muted-foreground">{entry.subtitle}</p>}
              {isTimeline && (entry.start_date || entry.is_current) && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {entry.start_date} — {entry.is_current ? 'Present' : entry.end_date || ''}
                </p>
              )}
              {entry.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{entry.description}</p>}
              {entry.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {entry.tags.map(tag => <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>)}
                </div>
              )}
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(entry)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(entry.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )
      ))}

      {adding ? renderForm() : (
        <Button variant="outline" size="sm" className="w-full" onClick={startAdd}>
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Add {CATEGORIES.find(c => c.id === category)?.label?.replace(/s$/, '') || 'Entry'}
        </Button>
      )}
    </div>
  );
}

const ResumeManager = () => {
  const { grouped, isLoading } = useGroupedResumeEntries();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Resume</h2>
        <p className="text-sm text-muted-foreground">Your professional knowledge base — powers the CV Agent and Magnet's context.</p>
      </div>

      <ProfileCard />

      <Tabs defaultValue="experience">
        <TabsList className="flex flex-wrap h-auto gap-1">
          {CATEGORIES.map(cat => (
            <TabsTrigger key={cat.id} value={cat.id} className="flex items-center gap-1.5 text-xs">
              <cat.icon className="h-3.5 w-3.5" />
              {cat.label}
              {(grouped[cat.id]?.length || 0) > 0 && (
                <Badge variant="secondary" className="h-4 px-1 text-[10px]">{grouped[cat.id].length}</Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {CATEGORIES.map(cat => (
          <TabsContent key={cat.id} value={cat.id}>
            {isLoading ? (
              <p className="text-sm text-muted-foreground p-4">Loading...</p>
            ) : (
              <EntryEditor category={cat.id} entries={grouped[cat.id] || []} />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default ResumeManager;
