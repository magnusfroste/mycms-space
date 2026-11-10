// ============================================
// OAuth connections — Claude / ChatGPT custom connectors and other OAuth MCP
// clients. They sign in through Supabase Auth's OAuth 2.1 server; the scopes
// chosen on /oauth/consent live in mcp_oauth_grants.
// ============================================

import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { MCP_ENDPOINT } from '@/components/admin/shell/nav';
import { Chip, EmptyState, Panel, tableStyles as t } from '@/components/admin/shell/primitives';
import { CopyButton } from '@/components/admin/skills/McpPanel';

export const MCP_OAUTH_URL = `${MCP_ENDPOINT}/oauth`;

type Grant = {
  client_id: string;
  client_name: string | null;
  scopes: string[];
  revoked: boolean;
  use_count: number;
  last_used_at: string | null;
  created_at: string;
};

// mcp_oauth_grants is not in the generated types yet
const grants = () => supabase.from('mcp_oauth_grants' as never);

function useGrants() {
  return useQuery({
    queryKey: ['mcp_oauth_grants'],
    queryFn: async () => {
      const { data, error } = await grants().select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Grant[];
    },
  });
}

function useRevokeGrant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (clientId: string) => {
      const { error } = await grants().update({ revoked: true, updated_at: new Date().toISOString() } as never).eq('client_id' as never, clientId as never);
      if (error) throw error;
      // Also drop Supabase's consent and refresh tokens, so the next connect asks again.
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/user/oauth/grants?client_id=${encodeURIComponent(clientId)}`, {
          method: 'DELETE',
          headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${token}` },
        }).catch(() => undefined);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mcp_oauth_grants'] }),
  });
}

export function OAuthConnectionsPanel() {
  const { data = [], isLoading } = useGrants();
  const revoke = useRevokeGrant();
  const active = data.filter((g) => !g.revoked);

  return (
    <Panel
      title="Connectors (OAuth)"
      description="For Claude, ChatGPT and other apps that connect with a sign-in instead of a key. Add the URL as a custom connector; you approve it here on the site and pick its scopes."
      actions={<CopyButton text={MCP_OAUTH_URL} label="Copy connector URL" />}
    >
      <div className="border-b border-border px-[18px] py-3 text-[13px]">
        <p className="break-all font-mono text-xs text-muted-foreground">{MCP_OAUTH_URL}</p>
        <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
          <li>Claude: Settings → Connectors → Add custom connector → paste the URL.</li>
          <li>ChatGPT: Settings → Apps &amp; Connectors → Developer mode → Create → paste the URL, authentication OAuth.</li>
        </ul>
      </div>
      {isLoading ? (
        <p className="px-[18px] py-6 text-center text-[13px] text-muted-foreground">Loading…</p>
      ) : active.length === 0 ? (
        <EmptyState title="No connector yet">
          Add the URL in Claude or ChatGPT. You are sent here to sign in and approve, then the agent can work in the CMS.
        </EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <table className={t.table}>
            <thead>
              <tr className={t.headRow}>
                <th scope="col" className={t.th}>App</th>
                <th scope="col" className={t.th}>Scopes</th>
                <th scope="col" className={t.th}>Last call</th>
                <th scope="col" className={`${t.th} text-right`}>Calls</th>
                <th scope="col" className={`${t.th} w-20`}><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {active.map((g) => (
                <tr key={g.client_id} className={t.row}>
                  <td className={t.td}>
                    <span className="font-semibold">{g.client_name || 'Unnamed client'}</span>
                    <span className="block font-mono text-[11px] text-muted-foreground">{g.client_id.slice(0, 8)}…</span>
                  </td>
                  <td className={t.td}>
                    <div className="flex flex-wrap gap-1">
                      {g.scopes.map((s) => (
                        <Chip key={s} mono>
                          {s}
                        </Chip>
                      ))}
                    </div>
                  </td>
                  <td className={`${t.td} whitespace-nowrap text-foreground/80`}>
                    {g.last_used_at ? formatDistanceToNow(new Date(g.last_used_at), { addSuffix: true }) : 'Never'}
                  </td>
                  <td className={`${t.td} text-right font-mono`}>{g.use_count}</td>
                  <td className={`${t.td} text-right`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-destructive hover:text-destructive"
                      disabled={revoke.isPending}
                      onClick={() =>
                        revoke.mutate(g.client_id, {
                          onSuccess: () => toast.success(`${g.client_name || 'The app'} is disconnected`),
                          onError: (e) => toast.error((e as Error).message),
                        })
                      }
                    >
                      Revoke
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
