// ============================================
// Operators — external agents with an MCP key (Hermes, Claude, ChatGPT …)
// ============================================

import { useState } from 'react';
import { differenceInDays, format, formatDistanceToNow } from 'date-fns';
import { MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MCP_ENDPOINT } from '@/components/admin/shell/nav';
import { Chip, EmptyState, Eyebrow, Panel, StatusPill, tableStyles as t } from '@/components/admin/shell/primitives';
import { CopyButton } from '@/components/admin/skills/McpPanel';
import { cn } from '@/lib/utils';
import {
  MCP_SCOPES,
  mcpClientConfig,
  useCreateOperatorKey,
  useOperators,
  useRevokeOperatorKey,
  useRotateOperatorKey,
  type McpScope,
  type Operator,
} from './agentsData';

const lastCallLabel = (iso: string | null) => {
  if (!iso) return 'Never';
  const d = new Date(iso);
  const days = differenceInDays(new Date(), d);
  if (days < 1) return `Today ${format(d, 'HH:mm')}`;
  if (days < 2) return `Yesterday ${format(d, 'HH:mm')}`;
  if (days < 7) return formatDistanceToNow(d, { addSuffix: true });
  return format(d, 'd MMM');
};

function KeyReveal({ name, value, onClose }: { name: string; value: string; onClose: () => void }) {
  const config = mcpClientConfig(value);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{name} can connect now</DialogTitle>
          <DialogDescription>
            Copy the key now. Only a hash is stored, so it cannot be shown again — if it gets lost, rotate it.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Eyebrow>Key</Eyebrow>
              <CopyButton text={value} label="Copy key" />
            </div>
            <code className="block break-all rounded-md bg-muted px-3 py-2 font-mono text-xs">{value}</code>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Eyebrow>MCP endpoint</Eyebrow>
              <CopyButton text={MCP_ENDPOINT} />
            </div>
            <code className="block break-all rounded-md bg-muted px-3 py-2 font-mono text-xs">{MCP_ENDPOINT}</code>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Eyebrow>Paste into the agent's MCP config</Eyebrow>
              <CopyButton text={config} />
            </div>
            <pre className="overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs">{config}</pre>
          </div>
          <p className="text-[12.5px] text-muted-foreground">
            Tell the agent to start with the <span className="font-mono">site_overview</span> tool.
          </p>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConnectDialog({ open, onOpenChange, onCreated }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: (name: string, key: string) => void;
}) {
  const create = useCreateOperatorKey();
  const [name, setName] = useState('');
  const [scopes, setScopes] = useState<McpScope[]>(['read', 'content', 'review']);

  const toggle = (id: McpScope) =>
    setScopes((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));

  const submit = () =>
    create.mutate(
      { name: name.trim(), scopes },
      {
        onSuccess: (data) => {
          if (!data.key) {
            toast.error('The key was created but not returned. Rotate it to get a new value.');
            return;
          }
          onCreated(name.trim(), data.key);
          setName('');
          setScopes(['read', 'content', 'review']);
        },
        onError: (e) => toast.error(`Could not create key: ${(e as Error).message}`),
      },
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Connect an agent</DialogTitle>
          <DialogDescription>
            Creates an MCP key for one agent. Give each agent its own key so you can see what it does and revoke it on its own.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="operator-name">Name</Label>
            <Input
              id="operator-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. hermes, claude-desktop, chatgpt"
              autoFocus
            />
          </div>
          <fieldset className="space-y-2">
            <legend className="mb-1 text-sm font-medium">What may it do?</legend>
            {MCP_SCOPES.map((s) => (
              <label
                key={s.id}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 transition-colors',
                  scopes.includes(s.id) && 'border-foreground/30 bg-muted/40',
                )}
              >
                <Checkbox checked={scopes.includes(s.id)} onCheckedChange={() => toggle(s.id)} className="mt-0.5" />
                <span>
                  <span className="block text-[13.5px] font-medium">
                    {s.label} <span className="font-mono text-xs font-normal text-muted-foreground">{s.id}</span>
                  </span>
                  <span className="block text-[12.5px] text-muted-foreground">{s.help}</span>
                </span>
              </label>
            ))}
          </fieldset>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={!name.trim() || scopes.length === 0 || create.isPending}>
            {create.isPending ? 'Creating…' : 'Create key'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function OperatorsPanel() {
  const { data: operators = [], isLoading } = useOperators();
  const revoke = useRevokeOperatorKey();
  const rotate = useRotateOperatorKey();
  const [connectOpen, setConnectOpen] = useState(false);
  const [revealed, setRevealed] = useState<{ name: string; key: string } | null>(null);
  const [confirm, setConfirm] = useState<{ op: Operator; action: 'revoke' | 'rotate' } | null>(null);

  const sorted = [...operators].sort((a, b) => Number(a.revoked) - Number(b.revoked));

  const runConfirm = () => {
    if (!confirm) return;
    const { op, action } = confirm;
    if (action === 'revoke') {
      revoke.mutate(op.id, {
        onSuccess: () => toast.success(`${op.name} can no longer connect`),
        onError: (e) => toast.error((e as Error).message),
      });
    } else {
      rotate.mutate(op.id, {
        onSuccess: (data) => data.key && setRevealed({ name: op.name, key: data.key }),
        onError: (e) => toast.error((e as Error).message),
      });
    }
    setConfirm(null);
  };

  return (
    <>
      <Panel
        title="Operators"
        description="Agents with an MCP key. Through MCP they can work in every admin area except keys and secrets, limited by the scopes you give them."
        actions={
          <Button size="sm" className="h-8" onClick={() => setConnectOpen(true)}>
            Connect an agent
          </Button>
        }
      >
        {isLoading ? (
          <p className="px-[18px] py-8 text-center text-[13px] text-muted-foreground">Loading…</p>
        ) : sorted.length === 0 ? (
          <EmptyState
            title="No operator connected yet"
            action={<Button size="sm" onClick={() => setConnectOpen(true)}>Connect an agent</Button>}
          >
            Create a key for Hermes, Claude or ChatGPT and paste it into the agent's MCP settings. It can then read the site,
            write drafts and decide on the review queue for you.
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className={t.table}>
              <thead>
                <tr className={t.headRow}>
                  <th scope="col" className={t.th}>Name</th>
                  <th scope="col" className={t.th}>Scopes</th>
                  <th scope="col" className={t.th}>Last call</th>
                  <th scope="col" className={`${t.th} text-right`}>Calls · 30 d</th>
                  <th scope="col" className={`${t.th} w-12`}><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((op) => {
                  const expired = !!op.expires_at && new Date(op.expires_at) < new Date();
                  return (
                    <tr key={op.id} className={cn(t.row, op.revoked && 'opacity-60')}>
                      <td className={t.td}>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{op.name}</span>
                          {op.revoked && <StatusPill tone="neutral">Revoked</StatusPill>}
                          {!op.revoked && expired && <StatusPill tone="warning">Expired</StatusPill>}
                        </div>
                        <span className="font-mono text-[11px] text-muted-foreground">{op.key_prefix}…</span>
                      </td>
                      <td className={t.td}>
                        <div className="flex flex-wrap gap-1">
                          {op.scopes.length === 0 ? (
                            <span className="text-xs text-muted-foreground">none</span>
                          ) : (
                            op.scopes.map((s) => (
                              <Chip key={s} mono>
                                {s}
                              </Chip>
                            ))
                          )}
                        </div>
                      </td>
                      <td className={`${t.td} whitespace-nowrap text-foreground/80`}>{lastCallLabel(op.lastCall)}</td>
                      <td className={`${t.td} text-right font-mono`}>{op.calls30d}</td>
                      <td className={`${t.td} text-right`}>
                        {!op.revoked && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Actions for ${op.name}`}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="text-[13px]" onClick={() => setConfirm({ op, action: 'rotate' })}>
                                Rotate key
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-[13px] text-destructive focus:text-destructive"
                                onClick={() => setConfirm({ op, action: 'revoke' })}
                              >
                                Revoke
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <ConnectDialog
        open={connectOpen}
        onOpenChange={setConnectOpen}
        onCreated={(name, key) => {
          setConnectOpen(false);
          setRevealed({ name, key });
        }}
      />

      {revealed && <KeyReveal name={revealed.name} value={revealed.key} onClose={() => setRevealed(null)} />}

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.action === 'revoke' ? `Revoke ${confirm.op.name}?` : `Rotate the key for ${confirm?.op.name}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.action === 'revoke'
                ? 'The agent loses access immediately. This cannot be undone; connect it again with a new key if needed.'
                : 'A new key is generated and the old one stops working at once. Paste the new key into the agent afterwards.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={runConfirm}>{confirm?.action === 'revoke' ? 'Revoke' : 'Rotate'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
