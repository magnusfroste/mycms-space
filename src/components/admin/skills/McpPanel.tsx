// ============================================
// MCP Panel — manage MCP API keys + activity log
// Exposes OpenClaw skills to external agents via MCP protocol
// ============================================

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import {
  Plus, Copy, Trash2, Check, KeyRound, Activity, Server,
  AlertTriangle, ExternalLink, Code,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const MCP_ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mcp-server`;

type McpKey = {
  id: string;
  name: string;
  key_prefix: string;
  description: string | null;
  scopes: string[];
  last_used_at: string | null;
  use_count: number;
  revoked: boolean;
  expires_at: string | null;
  created_at: string;
};

type McpActivity = {
  id: string;
  key_name: string | null;
  method: string;
  tool_name: string | null;
  status: string;
  duration_ms: number | null;
  error_message: string | null;
  created_at: string;
};

export default function McpPanel() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [newKey, setNewKey] = useState<{ key: string; name: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const { data: keys = [], isLoading: keysLoading } = useQuery({
    queryKey: ['mcp-keys'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mcp_api_keys')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as McpKey[];
    },
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['mcp-activities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mcp_activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as McpActivity[];
    },
    refetchInterval: 10_000,
  });

  const { data: exposedSkills = [] } = useQuery({
    queryKey: ['mcp-exposed-skills'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_skills')
        .select('name, description, category, scope')
        .eq('enabled', true)
        .in('scope', ['public', 'both', 'external'])
        .order('category');
      if (error) throw error;
      return data;
    },
  });

  const createKey = useMutation({
    mutationFn: async (params: { name: string; description: string; expires_in_days: number | null }) => {
      const { data, error } = await supabase.functions.invoke('mcp-keys', {
        body: { action: 'create', ...params },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data, variables) => {
      setNewKey({ key: data.key, name: variables.name });
      setCreateOpen(false);
      qc.invalidateQueries({ queryKey: ['mcp-keys'] });
      toast({ title: 'API key created', description: 'Copy it now — it won\'t be shown again.' });
    },
    onError: (err: Error) => toast({ title: 'Failed to create key', description: err.message, variant: 'destructive' }),
  });

  const revokeKey = useMutation({
    mutationFn: async (key_id: string) => {
      const { data, error } = await supabase.functions.invoke('mcp-keys', {
        body: { action: 'revoke', key_id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mcp-keys'] });
      toast({ title: 'Key revoked' });
    },
    onError: (err: Error) => toast({ title: 'Failed to revoke key', description: err.message, variant: 'destructive' }),
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const claudeConfig = `{
  "mcpServers": {
    "openclaw": {
      "url": "${MCP_ENDPOINT}",
      "headers": {
        "Authorization": "Bearer YOUR_MCP_KEY_HERE"
      }
    }
  }
}`;

  return (
    <div className="space-y-6">
      {/* New key dialog */}
      <Dialog open={!!newKey} onOpenChange={(o) => !o && setNewKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" /> Key created: {newKey?.name}
            </DialogTitle>
            <DialogDescription>
              Copy this key now. For security, it will <strong>never</strong> be shown again.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted rounded-md p-3 font-mono text-xs break-all">
            {newKey?.key}
          </div>
          <DialogFooter>
            <Button
              onClick={() => copyToClipboard(newKey?.key || '', 'new-key')}
              className="gap-2"
            >
              {copied === 'new-key' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied === 'new-key' ? 'Copied' : 'Copy key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Connection info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Server className="h-4 w-4" /> MCP Server endpoint
          </CardTitle>
          <CardDescription>
            External AI agents (Claude Desktop, Cursor, custom clients) can connect here using an API key.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Endpoint</Label>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-muted rounded px-3 py-2 text-xs font-mono break-all">
                {MCP_ENDPOINT}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(MCP_ENDPOINT, 'endpoint')}
              >
                {copied === 'endpoint' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Code className="h-3 w-3" /> Claude Desktop config
            </Label>
            <div className="relative">
              <pre className="bg-muted rounded p-3 text-xs font-mono overflow-x-auto">{claudeConfig}</pre>
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(claudeConfig, 'config')}
              >
                {copied === 'config' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Badge variant="outline" className="gap-1.5">
              <Activity className="h-3 w-3" /> {exposedSkills.length} tools exposed
            </Badge>
            <Badge variant="outline">Protocol: 2024-11-05</Badge>
            <Badge variant="outline">Transport: Streamable HTTP</Badge>
          </div>
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="h-4 w-4" /> API Keys
            </CardTitle>
            <CardDescription className="mt-1">
              Issue and revoke keys for external agents.
            </CardDescription>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" /> New key
              </Button>
            </DialogTrigger>
            <CreateKeyDialog onCreate={(p) => createKey.mutate(p)} pending={createKey.isPending} />
          </Dialog>
        </CardHeader>
        <CardContent>
          {keysLoading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Loading…</p>
          ) : keys.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No API keys yet. Create one to allow external MCP clients to connect.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Prefix</TableHead>
                  <TableHead>Scopes</TableHead>
                  <TableHead>Uses</TableHead>
                  <TableHead>Last used</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((k) => (
                  <TableRow key={k.id}>
                    <TableCell className="font-medium">{k.name}</TableCell>
                    <TableCell className="font-mono text-xs">{k.key_prefix}…</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {k.scopes.map((s) => (
                          <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{k.use_count}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {k.last_used_at
                        ? formatDistanceToNow(new Date(k.last_used_at), { addSuffix: true })
                        : 'Never'}
                    </TableCell>
                    <TableCell>
                      {k.revoked ? (
                        <Badge variant="destructive" className="text-[10px]">Revoked</Badge>
                      ) : k.expires_at && new Date(k.expires_at) < new Date() ? (
                        <Badge variant="outline" className="text-[10px]">Expired</Badge>
                      ) : (
                        <Badge variant="default" className="text-[10px] bg-green-600">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {!k.revoked && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Revoke "{k.name}"?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Any client using this key will immediately lose access. This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => revokeKey.mutate(k.id)}>
                                Revoke
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Exposed tools */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Exposed tools ({exposedSkills.length})</CardTitle>
          <CardDescription>
            All enabled skills with scope <Badge variant="outline" className="text-[10px]">public</Badge>,{' '}
            <Badge variant="outline" className="text-[10px]">both</Badge>, or{' '}
            <Badge variant="outline" className="text-[10px]">external</Badge> are available via MCP.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {exposedSkills.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>No tools exposed</AlertTitle>
              <AlertDescription>
                Set a skill's scope to <code>public</code>, <code>both</code>, or <code>external</code> in the Skills tab to make it available via MCP.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {exposedSkills.map((s: any) => (
                <div key={s.name} className="border border-border rounded-md p-2.5 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-xs font-mono font-semibold truncate">{s.name}</code>
                    <Badge variant="outline" className="text-[10px] shrink-0">{s.scope}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{s.description}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4" /> Recent activity
          </CardTitle>
          <CardDescription>Last 50 MCP requests across all keys.</CardDescription>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No MCP activity yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Tool</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-xs">{a.key_name || '—'}</TableCell>
                    <TableCell><code className="text-xs">{a.method}</code></TableCell>
                    <TableCell><code className="text-xs">{a.tool_name || '—'}</code></TableCell>
                    <TableCell>
                      <Badge
                        variant={a.status === 'success' ? 'default' : 'destructive'}
                        className="text-[10px]"
                      >
                        {a.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {a.duration_ms ? `${a.duration_ms}ms` : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        Learn more about the MCP protocol at{' '}
        <a href="https://modelcontextprotocol.io" target="_blank" rel="noreferrer" className="underline inline-flex items-center gap-1">
          modelcontextprotocol.io <ExternalLink className="h-3 w-3" />
        </a>
      </p>
    </div>
  );
}

function CreateKeyDialog({
  onCreate, pending,
}: {
  onCreate: (p: { name: string; description: string; expires_in_days: number | null }) => void;
  pending: boolean;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [expiresInDays, setExpiresInDays] = useState<string>('');

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Create MCP API key</DialogTitle>
        <DialogDescription>
          Issue a new key for an external agent or service.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="key-name">Name</Label>
          <Input
            id="key-name"
            placeholder="e.g. Claude Desktop, Cursor"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="key-desc">Description (optional)</Label>
          <Textarea
            id="key-desc"
            placeholder="What is this key for?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="key-expires">Expires in days (optional)</Label>
          <Input
            id="key-expires"
            type="number"
            min={1}
            placeholder="Leave blank = never"
            value={expiresInDays}
            onChange={(e) => setExpiresInDays(e.target.value)}
          />
        </div>
      </div>
      <DialogFooter>
        <Button
          disabled={!name.trim() || pending}
          onClick={() => onCreate({
            name: name.trim(),
            description: description.trim(),
            expires_in_days: expiresInDays ? parseInt(expiresInDays, 10) : null,
          })}
        >
          {pending ? 'Creating…' : 'Create key'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
