// ============================================
// Pages — list of pages and, per page, an ordered outline of its blocks.
// The visual page builder is gone: operators edit blocks through MCP, and
// here the owner reviews, reorders and fine-tunes them.
// ============================================

import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ArrowDown, ArrowUp, ChevronLeft, Code2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useCreatePage, usePages, useUpdatePage } from '@/models/pages';
import {
  useAllPageBlocks,
  useCreatePageBlock,
  useDeletePageBlock,
  usePageBlocks,
  useReorderPageBlocks,
  useUpdatePageBlock,
} from '@/models/pageBlocks';
import { blockTypeLabels } from '@/lib/constants/blockTypeLabels';
import { getDefaultBlockConfig } from '@/lib/constants/blockDefaults';
import type { BlockType, PageBlock } from '@/types';
import type { Page } from '@/types/pages';
import { AdminPageHeader } from '@/components/admin/shell/AdminPageHeader';
import { Chip, EmptyState, Panel, StatusPill, tableStyles as t } from '@/components/admin/shell/primitives';
import { cn } from '@/lib/utils';

const pageUrl = (page: Pick<Page, 'slug' | 'is_main_landing'>) => (page.is_main_landing ? '/' : `/${page.slug}`);

const blockLabel = (type: string) => (blockTypeLabels[type] ?? type).replace(/\s*✨/g, '');

/** A one-line, human summary of a block, derived from whatever its config holds. */
function summarizeBlock(block: PageBlock): string {
  const c = (block.block_config || {}) as Record<string, unknown>;
  const text = (k: string) => (typeof c[k] === 'string' ? (c[k] as string).trim() : '');
  const first =
    text('title') ||
    text('headline') ||
    text('heading') ||
    text('name') ||
    text('agent_name') ||
    text('tagline') ||
    text('subtitle') ||
    text('content');
  const lists = Object.entries(c).filter(([, v]) => Array.isArray(v) && (v as unknown[]).length > 0);
  const listPart = lists
    .slice(0, 2)
    .map(([k, v]) => `${(v as unknown[]).length} ${k.replace(/_/g, ' ')}`)
    .join(' · ');
  const base = first.replace(/<[^>]+>/g, '').replace(/[#*_>`]/g, '').replace(/\s+/g, ' ');
  const short = base.length > 90 ? `${base.slice(0, 90)}…` : base;
  return [short, listPart].filter(Boolean).join(' — ') || 'Default settings';
}

const allBlockTypes = Object.keys(blockTypeLabels) as BlockType[];

// ─── Page list ───────────────────────────────────────────────────────────────

function PageList({ onOpen }: { onOpen: (slug: string) => void }) {
  const { data: pages = [], isLoading } = usePages();
  const { data: blocks = [] } = useAllPageBlocks();
  const updatePage = useUpdatePage();
  const createPage = useCreatePage();
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');

  const stats = useMemo(() => {
    const map: Record<string, { count: number; lastEdit: string | null }> = {};
    for (const b of blocks) {
      const s = (map[b.page_slug] ??= { count: 0, lastEdit: null });
      s.count += 1;
      if (!s.lastEdit || b.updated_at > s.lastEdit) s.lastEdit = b.updated_at;
    }
    return map;
  }, [blocks]);

  const submitNewPage = () => {
    const cleanSlug = (slug.trim() || title).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
    if (!title.trim() || !cleanSlug) return;
    createPage.mutate(
      { title: title.trim(), slug: cleanSlug, enabled: false },
      {
        onSuccess: () => {
          setCreating(false);
          setTitle('');
          setSlug('');
          onOpen(cleanSlug);
        },
      },
    );
  };

  return (
    <>
      <Panel
        title="Pages"
        description={`${pages.length} page${pages.length === 1 ? '' : 's'} · new pages start hidden until you switch them on`}
        actions={
          <Button size="sm" onClick={() => setCreating(true)} className="h-8 gap-1.5">
            <Plus className="h-3.5 w-3.5" /> New page
          </Button>
        }
      >
        {isLoading ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : pages.length === 0 ? (
          <EmptyState title="No pages yet">Create a page, then add blocks to it — or ask an operator to do it through MCP.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className={t.table}>
              <thead>
                <tr className={t.headRow}>
                  <th className={t.th}>Page</th>
                  <th className={t.th}>Address</th>
                  <th className={`${t.th} text-right`}>Blocks</th>
                  <th className={t.th}>Last edit</th>
                  <th className={`${t.th} text-right`}>Visible</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((page) => {
                  const s = stats[page.slug];
                  const last = s?.lastEdit && s.lastEdit > page.updated_at ? s.lastEdit : page.updated_at;
                  return (
                    <tr
                      key={page.id}
                      className={cn(t.row, 'cursor-pointer transition-colors hover:bg-muted/40')}
                      onClick={() => onOpen(page.slug)}
                    >
                      <td className={t.td}>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{page.title}</span>
                          {page.is_main_landing && <Chip>Home</Chip>}
                        </div>
                        {page.description && (
                          <p className="mt-0.5 max-w-md truncate text-[12.5px] text-muted-foreground">{page.description}</p>
                        )}
                      </td>
                      <td className={`${t.td} font-mono text-xs text-foreground/80`}>{pageUrl(page)}</td>
                      <td className={`${t.td} text-right font-mono`}>{s?.count ?? 0}</td>
                      <td className={`${t.td} whitespace-nowrap text-foreground/80`}>
                        {last ? formatDistanceToNow(new Date(last), { addSuffix: true }) : '—'}
                      </td>
                      <td className={`${t.td} text-right`} onClick={(e) => e.stopPropagation()}>
                        <Switch
                          checked={page.enabled}
                          aria-label={`${page.enabled ? 'Hide' : 'Show'} ${page.title}`}
                          disabled={page.is_main_landing}
                          onCheckedChange={(enabled) => updatePage.mutate({ id: page.id, enabled })}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New page</DialogTitle>
            <DialogDescription>The page starts hidden. Add blocks, preview it, then switch it on.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="page-title">Title</Label>
              <Input
                id="page-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Services"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="page-slug">Address</Label>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-sm text-muted-foreground">/</span>
                <Input
                  id="page-slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder={title ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'services'}
                  className="font-mono"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={submitNewPage} disabled={!title.trim() || createPage.isPending}>
              Create page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Page detail: block outline ─────────────────────────────────────────────

function BlockJsonEditor({ block, onDone }: { block: PageBlock; onDone: () => void }) {
  const updateBlock = useUpdatePageBlock();
  const [text, setText] = useState(() => JSON.stringify(block.block_config ?? {}, null, 2));

  const parsed = useMemo(() => {
    try {
      const value = JSON.parse(text);
      if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        return { error: 'The config must be a JSON object ({ … }).' };
      }
      return { value: value as Record<string, unknown> };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }, [text]);

  const dirty = text !== JSON.stringify(block.block_config ?? {}, null, 2);

  return (
    <div className="space-y-2 border-t border-border bg-muted/30 px-[18px] py-4">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        aria-label={`JSON config for ${blockLabel(block.block_type)}`}
        className="min-h-[260px] bg-background font-mono text-xs leading-relaxed"
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={cn('text-xs', parsed.error ? 'text-destructive' : 'text-muted-foreground')}>
          {parsed.error ? `Invalid JSON: ${parsed.error}` : dirty ? 'Valid JSON · unsaved changes' : 'Valid JSON'}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-8" onClick={onDone}>
            Close
          </Button>
          <Button
            size="sm"
            className="h-8"
            disabled={!!parsed.error || !dirty || updateBlock.isPending}
            onClick={() =>
              parsed.value &&
              updateBlock.mutate(
                { id: block.id, block_config: parsed.value },
                {
                  onSuccess: () => {
                    toast.success('Block saved');
                    onDone();
                  },
                  onError: (e) => toast.error(`Could not save: ${(e as Error).message}`),
                },
              )
            }
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

function PageDetail({ slug, onBack }: { slug: string; onBack: () => void }) {
  const { data: pages = [] } = usePages();
  const page = pages.find((p) => p.slug === slug);
  const { data: blocks = [], isLoading } = usePageBlocks(slug);
  const updateBlock = useUpdatePageBlock();
  const deleteBlock = useDeletePageBlock();
  const createBlock = useCreatePageBlock();
  const reorder = useReorderPageBlocks();
  const updatePage = useUpdatePage();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<PageBlock | null>(null);
  const [adding, setAdding] = useState(false);
  const [newType, setNewType] = useState<BlockType>('text-section');

  const ordered = useMemo(() => [...blocks].sort((a, b) => a.order_index - b.order_index), [blocks]);

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= ordered.length) return;
    const next = [...ordered];
    [next[index], next[target]] = [next[target], next[index]];
    reorder.mutate(next.map((b, i) => ({ id: b.id, order_index: i })), {
      onError: () => toast.error('Could not reorder'),
    });
  };

  const addBlock = () => {
    const order = ordered.length ? Math.max(...ordered.map((b) => b.order_index)) + 1 : 0;
    createBlock.mutate(
      { page_slug: slug, block_type: newType, block_config: getDefaultBlockConfig(newType), order_index: order, enabled: false },
      {
        onSuccess: (b) => {
          setAdding(false);
          setEditingId(b.id);
          toast.success(`${blockLabel(newType)} added (hidden until you switch it on)`);
        },
        onError: (e) => toast.error(`Could not add block: ${(e as Error).message}`),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="mb-3 inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> All pages
        </button>
        <AdminPageHeader
          title={page?.title ?? slug}
          description={
            <span>
              <span className="font-mono text-xs">{page ? pageUrl(page) : `/${slug}`}</span>
              {page?.is_main_landing && ' · home page'}
              {page && !page.enabled && ' · hidden from visitors'}
            </span>
          }
          actions={
            <>
              {page && !page.is_main_landing && (
                <label className="mr-2 flex items-center gap-2 text-[13px]">
                  Visible
                  <Switch checked={page.enabled} onCheckedChange={(enabled) => updatePage.mutate({ id: page.id, enabled })} />
                </label>
              )}
              <Button variant="outline" size="sm" className="h-8" asChild>
                <a href={page ? pageUrl(page) : `/${slug}`} target="_blank" rel="noreferrer">
                  Preview ↗
                </a>
              </Button>
              <Button size="sm" className="h-8 gap-1.5" onClick={() => setAdding(true)}>
                <Plus className="h-3.5 w-3.5" /> Add block
              </Button>
            </>
          }
        />
      </div>

      <Panel title="Blocks" description="Top to bottom, in the order visitors see them. Hidden blocks are skipped on the site.">
        {isLoading ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : ordered.length === 0 ? (
          <EmptyState title="This page has no blocks" action={<Button size="sm" onClick={() => setAdding(true)}>Add a block</Button>}>
            Blocks are the sections of a page: a hero, a text section, a project grid…
          </EmptyState>
        ) : (
          <ol>
            {ordered.map((block, index) => (
              <li key={block.id} className={cn(index > 0 && 'border-t border-border/70')}>
                <div className="flex items-center gap-3 px-[18px] py-3">
                  <span className="w-6 shrink-0 text-right font-mono text-xs text-muted-foreground">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-[13.5px] font-semibold', !block.enabled && 'text-muted-foreground')}>
                        {blockLabel(block.block_type)}
                      </span>
                      <Chip mono>{block.block_type}</Chip>
                      {!block.enabled && <StatusPill tone="neutral">Hidden</StatusPill>}
                    </div>
                    <p className="mt-0.5 truncate text-[12.5px] text-muted-foreground">{summarizeBlock(block)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="Move up"
                      disabled={index === 0 || reorder.isPending}
                      onClick={() => move(index, -1)}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="Move down"
                      disabled={index === ordered.length - 1 || reorder.isPending}
                      onClick={() => move(index, 1)}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant={editingId === block.id ? 'secondary' : 'ghost'}
                      size="sm"
                      className="h-8 gap-1.5 px-2.5 text-[13px]"
                      onClick={() => setEditingId(editingId === block.id ? null : block.id)}
                    >
                      <Code2 className="h-3.5 w-3.5" /> Config
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      aria-label="Delete block"
                      onClick={() => setDeleting(block)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <Switch
                      className="ml-2"
                      checked={block.enabled}
                      aria-label={block.enabled ? 'Hide block' : 'Show block'}
                      onCheckedChange={(enabled) => updateBlock.mutate({ id: block.id, enabled })}
                    />
                  </div>
                </div>
                {editingId === block.id && <BlockJsonEditor block={block} onDone={() => setEditingId(null)} />}
              </li>
            ))}
          </ol>
        )}
      </Panel>

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a block</DialogTitle>
            <DialogDescription>
              It is added at the bottom, hidden, with placeholder content. Edit its config, then switch it on.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Block type</Label>
            <Select value={newType} onValueChange={(v) => setNewType(v as BlockType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {allBlockTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {blockLabel(type)} <span className="ml-1 font-mono text-xs text-muted-foreground">{type}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button onClick={addBlock} disabled={createBlock.isPending}>
              Add block
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this {deleting ? blockLabel(deleting.block_type) : ''} block?</AlertDialogTitle>
            <AlertDialogDescription>
              It disappears from the page right away. If you only want to take it off the site for now, switch it off instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                deleting &&
                deleteBlock.mutate(deleting.id, {
                  onSuccess: () => toast.success('Block deleted'),
                  onError: (e) => toast.error(`Could not delete: ${(e as Error).message}`),
                })
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function PagesView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const openSlug = searchParams.get('page');

  const open = (slug: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (slug) next.set('page', slug);
    else next.delete('page');
    setSearchParams(next);
  };

  if (openSlug) return <PageDetail slug={openSlug} onBack={() => open(null)} />;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Pages"
        description="Pages are made of blocks. Operators edit them through MCP; here you can review, reorder and fine-tune."
      />
      <PageList onOpen={open} />
    </div>
  );
}
