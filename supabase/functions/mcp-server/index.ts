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

  // ---- Authenticate via Bearer token (optional — anonymous = read-only built-ins) ----
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  let apiKey: any;

  if (!token) {
    // Anonymous read-only access — built-in tools only, no skill execution
    apiKey = {
      id: null,
      name: 'anonymous',
      scopes: ['tools:read', 'tools:call'],
      anonymous: true,
    };
  } else {
    const tokenHash = await sha256Hex(token);
    const { data: foundKey } = await supabase
      .from('mcp_api_keys')
      .select('*')
      .eq('key_hash', tokenHash)
      .eq('revoked', false)
      .maybeSingle();

    if (!foundKey) {
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

    if (foundKey.expires_at && new Date(foundKey.expires_at) < new Date()) {
      return new Response(JSON.stringify(jsonRpcError(null, -32001, 'API key expired')), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    apiKey = foundKey;

    // Bump usage (fire-and-forget)
    supabase.from('mcp_api_keys').update({
      last_used_at: new Date().toISOString(),
      use_count: (foundKey.use_count || 0) + 1,
    }).eq('id', foundKey.id).then(() => {});
  }

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
          resources: { listChanged: false, subscribe: false },
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

      // Anonymous = built-ins only (read-only metadata)
      if (apiKey.anonymous) {
        return { tools: BUILTIN_TOOLS };
      }

      const { data: skills } = await supabase
        .from('agent_skills')
        .select('name, description, tool_definition, scope, category')
        .eq('enabled', true)
        .in('scope', ['public', 'both', 'external'])
        .order('category');

      const skillTools = (skills || []).map((s: any) => {
        const def = s.tool_definition?.function || s.tool_definition || {};
        return {
          name: s.name,
          description: def.description || s.description || '',
          inputSchema: def.parameters || { type: 'object', properties: {} },
        };
      });

      return { tools: [...BUILTIN_TOOLS, ...skillTools] };
    }

    case 'tools/call': {
      if (!apiKey.scopes?.includes('tools:call')) {
        throw new Error('Scope tools:call required');
      }
      const { name, arguments: args } = rpc.params || {};
      if (!name) throw new Error('Missing tool name');

      // Built-in project tools — available to everyone (incl. anonymous)
      if (BUILTIN_TOOL_NAMES.has(name)) {
        const text = await callBuiltinTool(supabase, name, args || {});
        return { content: [{ type: 'text', text }], isError: false };
      }

      // Skill execution requires an authenticated API key
      if (apiKey.anonymous) {
        return {
          content: [{ type: 'text', text: `Tool '${name}' requires an API key. Built-in tools (${[...BUILTIN_TOOL_NAMES].join(', ')}) are available anonymously.` }],
          isError: true,
        };
      }



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

    case 'resources/list': {
      if (!apiKey.scopes?.includes('tools:read')) {
        throw new Error('Scope tools:read required');
      }
      const { data: repos } = await supabase
        .from('github_repos')
        .select('name, enriched_title, enriched_description, description, language, stars, topics')
        .eq('enabled', true)
        .order('order_index');

      const resources = (repos || []).map((r: any) => ({
        uri: `project://${r.name}`,
        name: r.enriched_title || r.name,
        description: r.enriched_description || r.description || `${r.language || ''} project`,
        mimeType: 'application/json',
      }));
      return { resources };
    }

    case 'resources/read': {
      if (!apiKey.scopes?.includes('tools:read')) {
        throw new Error('Scope tools:read required');
      }
      const uri: string = rpc.params?.uri || '';
      const match = uri.match(/^project:\/\/(.+)$/);
      if (!match) throw new Error(`Unknown resource URI: ${uri}`);
      const repoName = decodeURIComponent(match[1]);
      const project = await getProjectDetail(supabase, repoName);
      if (!project) throw new Error(`Project not found: ${repoName}`);
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(project, null, 2),
        }],
      };
    }

    case 'prompts/list':
      return { prompts: [] };

    default:
      throw new Error(`Method not supported: ${rpc.method}`);
  }
}

// ============================================
// Built-in tools — expose synced GitHub projects
// ============================================
const BUILTIN_TOOLS = [
  {
    name: 'list_projects',
    description: 'List all enabled GitHub projects with enriched titles, descriptions, languages, stars and topics. Use this to discover what projects exist before fetching details.',
    inputSchema: {
      type: 'object',
      properties: {
        language: { type: 'string', description: 'Optional: filter by primary language (e.g. TypeScript)' },
        topic: { type: 'string', description: 'Optional: filter by topic/tag' },
        limit: { type: 'number', description: 'Optional: max results (default 50)' },
      },
    },
  },
  {
    name: 'get_project',
    description: 'Get full enriched details for one GitHub project, including AI-enriched title, description, problem statement, why it matters, README, topics and images. Use this when writing about a specific project.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Repository name (e.g. "my-project")' },
      },
      required: ['name'],
    },
  },
  {
    name: 'search_projects',
    description: 'Full-text search across project titles, descriptions, problem statements, why-it-matters and topics. Returns matching projects with enriched data.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        limit: { type: 'number', description: 'Optional: max results (default 10)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_resume',
    description: 'Get the full resume / CV: work experience, education, certifications, skills and other timeline entries. Use this to understand background, expertise and availability when matching to consulting assignments or job opportunities.',
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'Optional: filter by category (e.g. "experience", "education", "skill", "certification")' },
      },
    },
  },
];
const BUILTIN_TOOL_NAMES = new Set(BUILTIN_TOOLS.map(t => t.name));

async function callBuiltinTool(
  supabase: ReturnType<typeof createClient>,
  name: string,
  args: any,
): Promise<string> {
  if (name === 'list_projects') {
    let q = supabase
      .from('github_repos')
      .select('name, enriched_title, enriched_description, description, language, stars, forks, topics, homepage, url')
      .eq('enabled', true)
      .order('order_index')
      .limit(Math.min(args.limit ?? 50, 200));
    if (args.language) q = q.eq('language', args.language);
    if (args.topic) q = q.contains('topics', [args.topic]);
    const { data, error } = await q;
    if (error) throw error;
    return JSON.stringify({ count: data?.length || 0, projects: data || [] }, null, 2);
  }

  if (name === 'get_project') {
    if (!args.name) throw new Error('Missing "name" argument');
    const project = await getProjectDetail(supabase, args.name);
    if (!project) return JSON.stringify({ error: `Project '${args.name}' not found` });
    return JSON.stringify(project, null, 2);
  }

  if (name === 'search_projects') {
    const query = (args.query || '').trim();
    if (!query) throw new Error('Missing "query" argument');
    const limit = Math.min(args.limit ?? 10, 50);
    const pattern = `%${query}%`;
    const { data, error } = await supabase
      .from('github_repos')
      .select('name, enriched_title, enriched_description, description, problem_statement, why_it_matters, language, stars, topics, homepage, url')
      .eq('enabled', true)
      .or(`name.ilike.${pattern},enriched_title.ilike.${pattern},enriched_description.ilike.${pattern},description.ilike.${pattern},problem_statement.ilike.${pattern},why_it_matters.ilike.${pattern}`)
      .limit(limit);
    if (error) throw error;
    return JSON.stringify({ count: data?.length || 0, query, projects: data || [] }, null, 2);
  }

  if (name === 'get_resume') {
    let q = supabase
      .from('resume_entries')
      .select('category, title, subtitle, description, start_date, end_date, is_current, tags, metadata')
      .eq('enabled', true)
      .order('category')
      .order('order_index')
      .order('start_date', { ascending: false });
    if (args.category) q = q.eq('category', args.category);
    const { data, error } = await q;
    if (error) throw error;
    return JSON.stringify({ count: data?.length || 0, entries: data || [] }, null, 2);
  }

  throw new Error(`Unknown built-in tool: ${name}`);
}


async function getProjectDetail(
  supabase: ReturnType<typeof createClient>,
  name: string,
): Promise<any | null> {
  const { data: repo } = await supabase
    .from('github_repos')
    .select('*')
    .eq('name', name)
    .eq('enabled', true)
    .maybeSingle();
  if (!repo) return null;
  const { data: images } = await supabase
    .from('github_repo_images')
    .select('image_url, alt_text, order_index')
    .eq('repo_id', repo.id)
    .order('order_index');
  return { ...repo, images: images || [] };
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
