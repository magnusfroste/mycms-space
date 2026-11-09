// Profile header (name, title, availability …) stored in the resume module.
// It is prepended to the knowledge base when the chat is grounded.
import { useState } from 'react';
import { useResumeModule, useUpdateResumeModule } from '@/models/modules';
import type { ResumeModuleConfig } from '@/types/modules';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfileCard() {
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
        <div><CardTitle className="text-base">Profile &amp; availability</CardTitle><p className="text-xs text-muted-foreground">Always included first when the chat answers.</p></div>
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
