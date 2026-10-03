import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import {
  useKnowledgeDocs, useKnowledgeHistory, useSaveKnowledgeDoc, useDeleteKnowledgeDoc,
  estimateWords, slugify,
} from '@/models/knowledgeBase';
import type { KnowledgeDoc, KnowledgeVisibility } from '@/models/knowledgeBase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, History, Lock, Globe, Plus, Save, Trash2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

const ResumeManager = lazy(() => import('@/components/admin/ResumeManager'));

interface Draft {
  id: string | null;
  slug: string;
  title: string;
  content: string;
  visibility: KnowledgeVisibility;
}

const emptyDraft: Draft = { id: null, slug: '', title: '', content: '', visibility: 'private' };

const toDraft = (d: KnowledgeDoc): Draft => ({
  id: d.id, slug: d.slug, title: d.title, content: d.content, visibility: d.visibility,
});

const formatTime = (iso: string) =>
  new Date(iso).toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' });

function KnowledgeBaseEditor() {
  const { data: docs = [], isLoading } = useKnowledgeDocs();
  const save = useSaveKnowledgeDoc();
  const remove = useDeleteKnowledgeDoc();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [showHistory, setShowHistory] = useState(false);
  const { data: history = [] } = useKnowledgeHistory(showHistory ? draft.id : null);

  const selected = useMemo(() => docs.find((d) => d.id === selectedId) || null, [docs, selectedId]);
  const dirty = selected
    ? draft.title !== selected.title || draft.content !== selected.content || draft.visibility !== selected.visibility
    : !!(draft.title || draft.content);

  useEffect(() => {
    if (!selectedId && docs.length) {
      setSelectedId(docs[0].id);
      setDraft(toDraft(docs[0]));
    }
  }, [docs, selectedId]);

  const open = (doc: KnowledgeDoc) => {
    if (dirty && !window.confirm('Discard unsaved changes?')) return;
    setSelectedId(doc.id);
    setDraft(toDraft(doc));
    setShowHistory(false);
  };

  const startNew = () => {
    if (dirty && !window.confirm('Discard unsaved changes?')) return;
    setSelectedId(null);
    setDraft(emptyDraft);
    setShowHistory(false);
  };

  const handleSave = async () => {
    const title = draft.title.trim();
    if (!title) return toast.error('Title is required');
    const slug = draft.id ? draft.slug : slugify(draft.slug || title);
    if (!draft.id && docs.some((d) => d.slug === slug)) return toast.error(`A document with slug "${slug}" already exists`);
    try {
      const saved = await save.mutateAsync({ slug, title, content: draft.content, visibility: draft.visibility });
      setSelectedId(saved.id);
      setDraft(toDraft(saved));
      toast.success('Saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save');
    }
  };

  const handleDelete = async () => {
    if (!draft.id || !window.confirm(`Delete "${draft.title}"? The last version stays in the history.`)) return;
    try {
      await remove.mutateAsync(draft.id);
      setSelectedId(null);
      setDraft(emptyDraft);
      toast.success('Deleted');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not delete');
    }
  };

  const words = estimateWords(docs);
  const publicWords = estimateWords(docs.filter((d) => d.visibility === 'public'));

  return (
    <div className="grid gap-4 md:grid-cols-[260px_1fr]">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Documents</CardTitle>
            <Button size="sm" variant="outline" onClick={startNew}><Plus className="h-4 w-4" /></Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {words.toLocaleString('sv-SE')} words · {publicWords.toLocaleString('sv-SE')} public
          </p>
        </CardHeader>
        <CardContent className="space-y-1 p-2">
          {isLoading && <p className="p-2 text-sm text-muted-foreground">Loading…</p>}
          {!isLoading && docs.length === 0 && (
            <p className="p-2 text-sm text-muted-foreground">
              Empty. Create a document here, or connect an agent via MCP and let it write with kb_upsert.
            </p>
          )}
          {docs.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => open(d)}
              className={`w-full rounded-md px-3 py-2 text-left transition-colors hover:bg-muted ${d.id === selectedId ? 'bg-muted' : ''}`}
            >
              <div className="flex items-center gap-2">
                {d.visibility === 'public'
                  ? <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  : <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                <span className="truncate text-sm font-medium">{d.title}</span>
              </div>
              <p className="mt-0.5 truncate pl-5 text-xs text-muted-foreground">
                {formatTime(d.updated_at)}{d.updated_by ? ` · ${d.updated_by}` : ''}
              </p>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="kb-title">Title</Label>
              <Input
                id="kb-title"
                value={draft.title}
                placeholder="e.g. Client assignments"
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2 pb-2">
              <Switch
                id="kb-public"
                checked={draft.visibility === 'public'}
                onCheckedChange={(on) => setDraft({ ...draft, visibility: on ? 'public' : 'private' })}
              />
              <Label htmlFor="kb-public" className="text-sm">Public</Label>
            </div>
          </div>
          {!draft.id && (
            <div className="space-y-1.5">
              <Label htmlFor="kb-slug">Slug</Label>
              <Input
                id="kb-slug"
                value={draft.slug}
                placeholder={slugify(draft.title) || 'client-assignments'}
                onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
              />
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            {draft.visibility === 'public'
              ? 'Public: grounds the site chat and the open MCP tools.'
              : 'Private: only the admin chat and agents with an MCP key can read it.'}
          </p>
          <Textarea
            value={draft.content}
            onChange={(e) => setDraft({ ...draft, content: e.target.value })}
            placeholder={'## Title — Organisation (YYYY-MM – YYYY-MM)\n\nWhat you did, which problem you solved, the result…'}
            className="min-h-[420px] font-mono text-sm"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handleSave} disabled={save.isPending || !dirty}>
              <Save className="mr-2 h-4 w-4" />{save.isPending ? 'Saving…' : 'Save'}
            </Button>
            {draft.id && (
              <>
                <Button variant="outline" onClick={() => setShowHistory((v) => !v)}>
                  <History className="mr-2 h-4 w-4" />History
                </Button>
                <Button variant="ghost" className="text-destructive" onClick={handleDelete} disabled={remove.isPending}>
                  <Trash2 className="mr-2 h-4 w-4" />Delete
                </Button>
              </>
            )}
            {dirty && <Badge variant="secondary">Unsaved</Badge>}
          </div>

          {showHistory && (
            <div className="space-y-2 rounded-md border p-3">
              {history.length === 0 && <p className="text-sm text-muted-foreground">No earlier versions yet.</p>}
              {history.map((v) => (
                <div key={v.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-muted-foreground">
                    {formatTime(v.created_at)} · {v.change_type}{v.changed_by ? ` by ${v.changed_by}` : ''} · {v.content.length.toLocaleString('sv-SE')} chars
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDraft({ ...draft, title: v.title, content: v.content, visibility: v.visibility })}
                  >
                    <RotateCcw className="mr-1 h-3.5 w-3.5" />Load
                  </Button>
                </div>
              ))}
              {history.length > 0 && (
                <p className="text-xs text-muted-foreground">Load puts the version in the editor; Save makes it current.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function KnowledgeBaseManager() {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <BookOpen className="mt-1 h-5 w-5 text-muted-foreground" />
        <div>
          <h2 className="text-xl font-semibold">Knowledge base</h2>
          <p className="text-sm text-muted-foreground">
            Your experience as plain markdown. The chat, the CV tools and any agent connected via MCP read it.
          </p>
        </div>
      </div>
      <Tabs defaultValue="kb">
        <TabsList>
          <TabsTrigger value="kb">Documents</TabsTrigger>
          <TabsTrigger value="timeline">Timeline (legacy)</TabsTrigger>
        </TabsList>
        <TabsContent value="kb" className="mt-4"><KnowledgeBaseEditor /></TabsContent>
        <TabsContent value="timeline" className="mt-4">
          <p className="mb-3 text-sm text-muted-foreground">
            Used only as a fallback when the knowledge base is empty, and for profile details such as name and availability.
          </p>
          <Suspense fallback={null}><ResumeManager /></Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
