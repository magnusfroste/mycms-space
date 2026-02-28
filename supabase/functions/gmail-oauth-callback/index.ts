// ============================================
// Gmail OAuth Callback Edge Function
// Handles OAuth redirect, exchanges code for tokens
// ============================================

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const SCOPES = 'https://www.googleapis.com/auth/gmail.readonly';

function getRedirectUri(): string {
  const url = Deno.env.get("SUPABASE_URL")!;
  return `${url}/functions/v1/gmail-oauth-callback`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // ============================================
  // GET /gmail-oauth-callback?action=authorize
  // → Redirect user to Google consent screen
  // ============================================
  if (req.method === 'GET' && url.searchParams.get('action') === 'authorize') {
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    if (!clientId) {
      return new Response('GOOGLE_CLIENT_ID not configured', { status: 500 });
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: getRedirectUri(),
      response_type: 'code',
      scope: SCOPES,
      access_type: 'offline',
      prompt: 'consent',
      state: 'gmail_connect',
    });

    return Response.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`, 302);
  }

  // ============================================
  // GET /gmail-oauth-callback?code=...&state=...
  // → Exchange code for tokens, store in modules
  // ============================================
  if (req.method === 'GET' && url.searchParams.get('code')) {
    const code = url.searchParams.get('code')!;
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      return new Response('Google OAuth not configured', { status: 500 });
    }

    try {
      // Exchange code for tokens
      const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: getRedirectUri(),
          grant_type: 'authorization_code',
        }),
      });

      const tokens = await tokenRes.json();

      if (!tokenRes.ok || !tokens.access_token) {
        console.error('[Gmail OAuth] Token exchange failed:', tokens);
        return new Response(`OAuth failed: ${tokens.error_description || tokens.error || 'Unknown'}`, { status: 400 });
      }

      // Get user email for display
      const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const profile = profileRes.ok ? await profileRes.json() : {};

      // Store tokens in modules table
      const supabase = getSupabase();
      const config = {
        connected: true,
        email: profile.email || '',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: Date.now() + (tokens.expires_in * 1000),
        connected_at: new Date().toISOString(),
        // Signal harvesting settings
        filter_senders: ['notifications-noreply@linkedin.com'],
        filter_labels: [],
        max_messages: 20,
        scan_days: 7,
      };

      const { data: existing } = await supabase
        .from('modules')
        .select('id')
        .eq('module_type', 'gmail_signals')
        .maybeSingle();

      if (existing) {
        await supabase.from('modules')
          .update({ module_config: config as any, enabled: true })
          .eq('id', existing.id);
      } else {
        await supabase.from('modules')
          .insert([{ module_type: 'gmail_signals', module_config: config as any, enabled: true }]);
      }

      // Redirect back to admin with success
      const adminUrl = Deno.env.get('SITE_URL') || 'https://www.froste.eu';
      return Response.redirect(`${adminUrl}/admin?tab=integrations&gmail=connected`, 302);
    } catch (e) {
      console.error('[Gmail OAuth] Error:', e);
      return new Response(`Error: ${e instanceof Error ? e.message : 'Unknown'}`, { status: 500 });
    }
  }

  // ============================================
  // POST /gmail-oauth-callback { action: 'disconnect' }
  // → Remove tokens
  // ============================================
  if (req.method === 'POST') {
    const body = await req.json();

    if (body.action === 'disconnect') {
      const supabase = getSupabase();
      await supabase.from('modules')
        .update({ enabled: false, module_config: { connected: false } as any })
        .eq('module_type', 'gmail_signals');

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (body.action === 'status') {
      const supabase = getSupabase();
      const { data } = await supabase
        .from('modules')
        .select('module_config, enabled')
        .eq('module_type', 'gmail_signals')
        .maybeSingle();

      const config = data?.module_config as Record<string, unknown> || {};

      // Also fetch last scan result for preview
      const { data: lastScan } = await supabase
        .from('agent_tasks')
        .select('output_data, created_at')
        .eq('task_type', 'inbox_digest')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return new Response(
        JSON.stringify({
          connected: data?.enabled && config.connected,
          email: config.email || null,
          connected_at: config.connected_at || null,
          filter_senders: config.filter_senders || [],
          filter_labels: config.filter_labels || [],
          max_messages: config.max_messages || 20,
          scan_days: config.scan_days || 7,
          last_scan: lastScan ? {
            scanned_at: lastScan.created_at,
            signal_count: (lastScan.output_data as any)?.signal_count || 0,
            suggested_topics: (lastScan.output_data as any)?.suggested_topics || [],
          } : null,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update settings
    if (body.action === 'update_settings') {
      const supabase = getSupabase();
      const { data: existing } = await supabase
        .from('modules')
        .select('module_config')
        .eq('module_type', 'gmail_signals')
        .maybeSingle();

      if (!existing) {
        return new Response(JSON.stringify({ error: 'Not connected' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const currentConfig = existing.module_config as Record<string, unknown>;
      const updated = {
        ...currentConfig,
        filter_senders: body.filter_senders ?? currentConfig.filter_senders,
        filter_labels: body.filter_labels ?? currentConfig.filter_labels,
        max_messages: body.max_messages ?? currentConfig.max_messages,
        scan_days: body.scan_days ?? currentConfig.scan_days,
      };

      await supabase.from('modules')
        .update({ module_config: updated as any })
        .eq('module_type', 'gmail_signals');

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  return new Response('Not found', { status: 404 });
});
