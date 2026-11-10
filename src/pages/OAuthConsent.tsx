// ============================================
// OAuth consent — /oauth/consent?authorization_id=…
//
// Supabase Auth's OAuth 2.1 server sends the admin here when an MCP client
// (a Claude or ChatGPT custom connector, or any other OAuth MCP client) asks
// to connect. The admin picks what the agent may do; the scopes are stored in
// mcp_oauth_grants and enforced by the MCP server.
// ============================================

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bot, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Login } from '@/components/admin/Login';
import SEOHead from '@/components/common/SEOHead';
import { FramedNotice, isFramed } from '@/components/common/FrameGuard';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const SCOPES = [
  { id: 'read', label: 'Read', hint: 'Site overview, inbox, analytics, drafts, private knowledge base' },
  { id: 'content', label: 'Content', hint: 'Knowledge base, blog drafts, page blocks, projects, newsletter drafts' },
  { id: 'review', label: 'Review', hint: 'Approve Autopilot work, publish posts, send newsletters' },
  { id: 'settings', label: 'Settings', hint: 'Module settings, navigation, automations' },
] as const;
const DEFAULT_SCOPES = ['read', 'content', 'review'];

type Details = {
  authorization_id: string;
  redirect_uri?: string;
  scope: string;
  client: { client_id: string; client_name: string; client_uri: string; logo_uri: string };
  user: { id: string; email: string };
};

// mcp_oauth_grants is not in the generated types yet
const grants = () => supabase.from('mcp_oauth_grants' as never);

// Where well-known MCP clients send the authorization code. Anything else is
// shown with a warning: anyone can register a client and call it "Claude".
const KNOWN_HOSTS = /(^|\.)(claude\.ai|anthropic\.com|chatgpt\.com|openai\.com)$/;
const LOCAL_HOSTS = /^(localhost|127\.0\.0\.1|\[::1\])$/;

type Destination = { host: string; known: boolean; local: boolean } | null;

const destinationOf = (uri: string | null | undefined): Destination => {
  if (!uri) return null;
  try {
    const host = new URL(uri).hostname;
    return { host, known: KNOWN_HOSTS.test(host), local: LOCAL_HOSTS.test(host) };
  } catch {
    return { host: uri, known: false, local: false };
  }
};

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get('authorization_id') || '';
  const { user, loading } = useAuth();
  const [details, setDetails] = useState<Details | null>(null);
  const [error, setError] = useState('');
  const [scopes, setScopes] = useState<string[]>(DEFAULT_SCOPES);
  const [busy, setBusy] = useState(false);
  const [dest, setDest] = useState<Destination>(null);
  const framed = isFramed();

  useEffect(() => {
    if (!user || !authorizationId) return;
    let cancelled = false;
    (async () => {
      const { data: admin } = await supabase.from('admin_users' as never).select('user_id').eq('user_id' as never, user.id as never).maybeSingle();
      if (!admin) {
        if (!cancelled) setError('Only the site admin can connect an agent.');
        return;
      }
      const { data, error: err } = await supabase.auth.oauth.getAuthorizationDetails(authorizationId);
      if (cancelled) return;
      if (err || !data) {
        setError(err?.message || 'This authorization request was not found or has expired. Start the connection again from the agent.');
        return;
      }
      // Already approved earlier: Supabase hands back the redirect directly.
      const raw = data as Partial<Details> & { redirect_url?: string };
      const already = !raw.authorization_id ? raw.redirect_url || raw.redirect_uri : !raw.client ? raw.redirect_uri : undefined;
      if (already) {
        window.location.href = already;
        return;
      }
      const d = data as Details;
      const { data: info } = await supabase.rpc('oauth_request_info' as never, { p_authorization_id: authorizationId } as never);
      const rows = info as unknown as Array<{ redirect_uri?: string }> | null;
      const row = Array.isArray(rows) ? rows[0] : null;
      if (cancelled) return;
      setDest(destinationOf(row?.redirect_uri || d.redirect_uri));
      setDetails(d);
      const { data: existing } = await grants().select('scopes').eq('client_id' as never, d.client.client_id as never).maybeSingle();
      const prev = (existing as { scopes?: string[] } | null)?.scopes;
      if (prev?.length) setScopes(prev);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authorizationId]);

  const toggle = (id: string, on: boolean) =>
    setScopes((s) => (on ? [...new Set([...s, id])] : s.filter((x) => x !== id)));

  const decide = async (approve: boolean) => {
    if (!details || !user) return;
    setBusy(true);
    try {
      if (approve) {
        const { error: saveErr } = await grants().upsert({
          client_id: details.client.client_id,
          client_name: details.client.client_name || null,
          scopes,
          user_id: user.id,
          revoked: false,
          updated_at: new Date().toISOString(),
        } as never);
        if (saveErr) throw saveErr;
      }
      const { data, error: err } = approve
        ? await supabase.auth.oauth.approveAuthorization(authorizationId, { skipBrowserRedirect: true })
        : await supabase.auth.oauth.denyAuthorization(authorizationId, { skipBrowserRedirect: true });
      if (err || !data?.redirect_url) throw err || new Error('No redirect from the authorization server');
      window.location.href = data.redirect_url;
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  if (framed) return <FramedNotice />;
  if (loading) return <div className="min-h-screen bg-background" />;
  if (!user) return <Login />;

  const name = details?.client.client_name || 'An agent';

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <SEOHead title="Connect an agent" description="Approve an MCP connection." noIndex />
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Bot className="h-5 w-5 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl">{details ? `${name} wants to operate this site` : 'Connect an agent'}</CardTitle>
          <CardDescription>
            {details
              ? `It will act through MCP as ${details.user.email}. Pick what it may do; you can change or revoke this in Admin → Agents.`
              : 'Checking the request…'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {!authorizationId && <p className="text-sm text-destructive">Missing authorization_id. Start the connection from the agent.</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!details && !error && authorizationId && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
          {details && (
            <div className="space-y-3">
              {SCOPES.map((s) => (
                <label key={s.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 hover:bg-muted/50">
                  <Checkbox checked={scopes.includes(s.id)} onCheckedChange={(v) => toggle(s.id, v === true)} className="mt-0.5" />
                  <span>
                    <span className="block text-sm font-medium">{s.label}</span>
                    <span className="block text-xs text-muted-foreground">{s.hint}</span>
                  </span>
                </label>
              ))}
              <div
                className={`rounded-lg border p-3 text-xs ${
                  dest?.known ? 'border-border text-muted-foreground' : 'border-amber-500/50 bg-amber-500/10 text-foreground'
                }`}
              >
                <p>
                  Access goes to: <span className="font-mono font-semibold">{dest?.host || 'unknown'}</span>
                </p>
                {!dest?.known && (
                  <p className="mt-1">
                    {dest?.local
                      ? 'An app on your own computer (Claude Code, Cursor, Hermes …). Allow only if you just started the connection there.'
                      : 'Not Claude or ChatGPT. The name above is chosen by the app itself; allow only if you know where this address belongs.'}
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>

        {details && (
          <CardFooter className="flex gap-2">
            <Button variant="outline" className="flex-1" disabled={busy} onClick={() => decide(false)}>
              Deny
            </Button>
            <Button className="flex-1" disabled={busy || scopes.length === 0} onClick={() => decide(true)}>
              {busy ? 'Connecting…' : 'Allow'}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
