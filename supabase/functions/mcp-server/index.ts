// ============================================
// MCP Server — Model Context Protocol endpoint
// Exposes OpenClaw agent_skills as MCP tools
// Spec: https://modelcontextprotocol.io
// Transport: Streamable HTTP (JSON-RPC 2.0)
// ============================================

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, mcp-session-id',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const PROTOCOL_VERSION = '2024-11-05';
const SERVER_NAME = 'openclaw-mcp';
const SERVER_VERSION = '1.0.0';

// Hash a key using SHA-256 (matches Web Crypto for verification)
async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: any;
}

function jsonRpcResult(id: any, result: any) {
  return { jsonrpc: '2.0', id: id ?? null, result };
}

function jsonRpcError(id: any, code: number, message: string, data?: any) {
  return { jsonrpc: '2.0', id: id ?? null, error: { code, message, data } };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);

  // ---- GET = capability discovery (handy for browsers / health checks)
  if (req.method === 'GET') {
    return new Response(JSON.stringify({
      name: SERVER_NAME,
      version: SERVER_VERSION,
      protocol: PROTOCOL_VERSION,
      transport: 'streamable-http',
      description: "OpenClaw MCP Server — exposes Magnet's skill engine to external agents",
      endpoint: `${supabaseUrl}/functions/v1/mcp-server`,
      auth: { type: 'bearer', header: 'Authorization' },
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  // ---- Authenticate via Bearer token ----
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    return new Response(JSON.stringify(jsonRpcError(null, -32001, 'Missing Authorization: Bearer <key>')), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const tokenHash = await sha256Hex(token);
  const { data: apiKey } = await supabase
    .from('mcp_api_keys')
    .select('*')
    .eq('key_hash', tokenHash)
    .eq('revoked', false)
    .maybeSingle();

  if (!apiKey) {
    await logActivity(supabase, {
      api_key_id: null, key_name: null,
      method: 'auth', tool_name: null,
      input: {}, output: {},
      status: 'failed',
      error_message: 'Invalid or revoked API key',
      duration_ms: 0,
      ip_address: req.headers.get('x-forwarded-for') || null,
      client_info: { user_agent: req.headers.get('user-agent') || '' },
    });
    return new Response(JSON.stringify(jsonRpcError(null, -32001, 'Invalid or revoked API key')), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Check expiry
  if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
    return new Response(JSON.stringify(jsonRpcError(null, -32001, 'API key expired')), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Bump usage (fire-and-forget)
  supabase.from('mcp_api_keys').update({
    last_used_at: new Date().toISOString(),
    use_count: (apiKey.use_count || 0) + 1,
  }).eq('id', apiKey.id).then(() => {});

  // ---- Parse JSON-RPC request ----
  let body: JsonRpcRequest | JsonRpcRequest[];
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify(jsonRpcError(null, -32700, 'Parse error')), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const requests = Array.isArray(body) ? body : [body];
  const responses: any[] = [];

  for (const rpc of requests) {
    const startTime = Date.now();
    try {
      const result = await handleMethod(supabase, apiKey, rpc);
      // Notifications (no id) get no response
      if (rpc.id === undefined || rpc.id === null) {
        if (rpc.method !== 'notifications/initialized') {
          // still log
        }
      } else {
        responses.push(jsonRpcResult(rpc.id, result));
      }

      // Log non-trivial methods
      if (['tools/call', 'tools/list', 'initialize'].includes(rpc.method)) {
        await logActivity(supabase, {
          api_key_id: apiKey.id,
          key_name: apiKey.name,
          method: rpc.method,
          tool_name: rpc.method === 'tools/call' ? rpc.params?.name : null,
          input: rpc.params || {},
          output: rpc.method === 'tools/call' ? result : {},
          status: 'success',
          duration_ms: Date.now() - startTime,
          ip_address: req.headers.get('x-forwarded-for') || null,
          client_info: { user_agent: req.headers.get('user-agent') || '' },
        });
      }
    } catch (err) {
      const message = (err as Error).message || 'Internal error';
      console.error('[mcp-server] error:', message);
      if (rpc.id !== undefined && rpc.id !== null) {
        responses.push(jsonRpcError(rpc.id, -32603, message));
      }
      await logActivity(supabase, {
        api_key_id: apiKey.id,
        key_name: apiKey.name,
        method: rpc.method,
        tool_name: rpc.method === 'tools/call' ? rpc.params?.name : null,
        input: rpc.params || {},
        output: {},
        status: 'failed',
        error_message: message,
        duration_ms: Date.now() - startTime,
        ip_address: req.headers.get('x-forwarded-for') || null,
        client_info: { user_agent: req.headers.get('user-agent') || '' },
      });
    }
  }

  // Notifications-only batch returns 202
  if (responses.length === 0) {
    return new Response(null, { status: 202, headers: corsHeaders });
  }

  const responseBody = Array.isArray(body) ? responses : responses[0];
  return new Response(JSON.stringify(responseBody), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});

// ============================================
// Method dispatcher
// ============================================
async function handleMethod(
  supabase: ReturnType<typeof createClient>,
  apiKey: any,
  rpc: JsonRpcRequest,
): Promise<any> {
  switch (rpc.method) {
    case 'initialize':
      return {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: {
          tools: { listChanged: false },
          logging: {},
        },
        serverInfo: {
          name: SERVER_NAME,
          version: SERVER_VERSION,
        },
      };

    case 'notifications/initialized':
    case 'notifications/cancelled':
      return null; // notifications don't return

    case 'ping':
      return {};

    case 'tools/list': {
      if (!apiKey.scopes?.includes('tools:read')) {
        throw new Error('Scope tools:read required');
      }
      const { data: skills } = await supabase
        .from('agent_skills')
        .select('name, description, tool_definition, scope, category')
        .eq('enabled', true)
        .in('scope', ['public', 'both', 'external'])
        .order('category');

      const tools = (skills || []).map((s: any) => {
        const def = s.tool_definition?.function || s.tool_definition || {};
        return {
          name: s.name,
          description: def.description || s.description || '',
          inputSchema: def.parameters || { type: 'object', properties: {} },
        };
      });

      return { tools };
    }

    case 'tools/call': {
      if (!apiKey.scopes?.includes('tools:call')) {
        throw new Error('Scope tools:call required');
      }
      const { name, arguments: args } = rpc.params || {};
      if (!name) throw new Error('Missing tool name');

      // Verify the skill exists and is exposed
      const { data: skill } = await supabase
        .from('agent_skills')
        .select('id, name, scope, enabled')
        .eq('name', name)
        .eq('enabled', true)
        .maybeSingle();

      if (!skill) {
        return {
          content: [{ type: 'text', text: `Tool '${name}' not found or not exposed via MCP` }],
          isError: true,
        };
      }
      if (!['public', 'both', 'external'].includes(skill.scope)) {
        return {
          content: [{ type: 'text', text: `Tool '${name}' is internal-only` }],
          isError: true,
        };
      }

      // Delegate execution to agent-execute
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const execResp = await fetch(`${supabaseUrl}/functions/v1/agent-execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          skill_name: name,
          arguments: args || {},
          agent_type: 'chat',
          conversation_id: `mcp-${apiKey.id}`,
        }),
      });

      const execResult = await execResp.json();
      const text = typeof execResult === 'string'
        ? execResult
        : JSON.stringify(execResult.result ?? execResult, null, 2);

      return {
        content: [{ type: 'text', text }],
        isError: !execResp.ok || execResult.error,
      };
    }

    case 'resources/list':
      return { resources: [] };

    case 'prompts/list':
      return { prompts: [] };

    default:
      throw new Error(`Method not supported: ${rpc.method}`);
  }
}

// ============================================
// Activity logging
// ============================================
async function logActivity(
  supabase: ReturnType<typeof createClient>,
  activity: {
    api_key_id: string | null;
    key_name: string | null;
    method: string;
    tool_name: string | null;
    input: any;
    output: any;
    status: string;
    duration_ms: number;
    error_message?: string;
    ip_address?: string | null;
    client_info?: any;
  },
): Promise<void> {
  try {
    await supabase.from('mcp_activities').insert(activity);
  } catch (err) {
    console.error('[mcp-server] failed to log activity:', err);
  }
}
