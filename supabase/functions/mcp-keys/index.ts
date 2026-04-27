// ============================================
// MCP Keys — admin endpoint to issue/revoke keys
// ============================================

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateKey(): string {
  // openclaw_mcp_<32 random hex chars>
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return `oc_mcp_${hex}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const { action, name, description, scopes, expires_in_days, key_id } = await req.json();

    if (action === 'create') {
      if (!name || typeof name !== 'string') {
        return new Response(JSON.stringify({ error: 'name required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const plainKey = generateKey();
      const keyHash = await sha256Hex(plainKey);
      const keyPrefix = plainKey.substring(0, 14); // "oc_mcp_xxxxxxx"

      const expiresAt = expires_in_days
        ? new Date(Date.now() + expires_in_days * 86400_000).toISOString()
        : null;

      const { data, error } = await supabase.from('mcp_api_keys').insert({
        name,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        scopes: scopes || ['tools:read', 'tools:call'],
        description: description || null,
        expires_at: expiresAt,
        created_by: 'admin',
      }).select('id, name, key_prefix, scopes, expires_at, created_at').single();

      if (error) throw error;

      // Return plain key ONCE — never stored
      return new Response(JSON.stringify({
        ...data,
        key: plainKey,
        warning: 'Store this key securely — it will not be shown again.',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'revoke') {
      if (!key_id) {
        return new Response(JSON.stringify({ error: 'key_id required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { error } = await supabase.from('mcp_api_keys').update({
        revoked: true,
        revoked_at: new Date().toISOString(),
      }).eq('id', key_id);
      if (error) throw error;
      return new Response(JSON.stringify({ status: 'revoked' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'unknown action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[mcp-keys] error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
