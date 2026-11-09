// ============================================
// MCP Server — Model Context Protocol endpoint
// External agents (Hermes, Claude, ChatGPT …) operate the CMS through it:
// CMS tools by key scope, profile/project/knowledge tools, and agent skills.
// Spec: https://modelcontextprotocol.io
// Transport: Streamable HTTP (JSON-RPC 2.0)
// ============================================

import { createClient } from "npm:@supabase/supabase-js@2";
import { PROFILE_TOOL_NAMES, callProfileTool, loadOwner, profileTools, type Owner } from "./profile-tools.ts";
import { KNOWLEDGE_TOOLS, KNOWLEDGE_TOOL_NAMES, callKnowledgeTool } from "../_shared/knowledge-tools.ts";
import { loadResumeContext } from "../_shared/ai-context.ts";
import { CMS_TOOL_NAMES, callCmsTool, cmsToolsFor, effectiveScopes } from "./cms-tools.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, mcp-session-id',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Newest first. The server answers with the client's version when it is listed,
// otherwise with the newest one (spec: lifecycle / version negotiation).
const PROTOCOL_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'];
const PROTOCOL_VERSION = PROTOCOL_VERSIONS[0];
const SERVER_NAME = 'mycms';
const SERVER_VERSION = '2.1.0';

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

  // ---- GET with Accept: text/event-stream = a client asking for a server-push
  // stream. This server never pushes, so per spec it answers 405.
  if (req.method === 'GET' && (req.headers.get('accept') || '').includes('text/event-stream')) {
    return new Response('This server does not offer a server-initiated stream', { status: 405, headers: { ...corsHeaders, Allow: 'POST, OPTIONS' } });
  }

  // ---- GET = capability discovery (handy for browsers / health checks)
  if (req.method === 'GET') {
    return new Response(JSON.stringify({
      name: SERVER_NAME,
      version: SERVER_VERSION,
      protocol: PROTOCOL_VERSION,
      transport: 'streamable-http',
      description: "Personal CMS MCP server: external agents operate the site; visiting agents read the public profile.",
      endpoint: `${supabaseUrl}/functions/v1/mcp-server`,
      auth: { type: 'bearer', header: 'Authorization', required: false, note: 'Anonymous: public read tools (profile, projects, public knowledge base, job fit, contact). With an API key the CMS tools appear according to the key scopes: read (everything incl. inbox, analytics, private knowledge), content (blog drafts, pages & blocks, projects, newsletter drafts, knowledge base writes), review (approve Autopilot work, publish, send newsletters), settings (site settings, modules, navigation, automations, internal skills). Start with site_overview.' },
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
    apiKey.cmsScopes = effectiveScopes(foundKey.scopes);

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
      // Notifications (initialized, cancelled, progress …) need no handling.
      if (typeof rpc.method === 'string' && rpc.method.startsWith('notifications/')) continue;
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
        responses.push(jsonRpcError(rpc.id, message.startsWith('Method not supported') ? -32601 : -32603, message));
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
  supabase: any,
  apiKey: any,
  rpc: JsonRpcRequest,
): Promise<any> {
  switch (rpc.method) {
    case 'initialize': {
      const requested = rpc.params?.protocolVersion;
      const owner = await loadOwner(supabase);
      return {
        protocolVersion: PROTOCOL_VERSIONS.includes(requested) ? requested : PROTOCOL_VERSION,
        capabilities: {
          tools: { listChanged: false },
          resources: { listChanged: false, subscribe: false },
          prompts: { listChanged: false },
        },
        serverInfo: {
          name: SERVER_NAME,
          title: owner.siteTitle || `${owner.name} – personal CMS`,
          version: SERVER_VERSION,
        },
        instructions: serverInstructions(owner, apiKey),
      };
    }

    case 'ping':
      return {};

    case 'tools/list': {
      // Anonymous = public read-only built-ins
      const owner = await loadOwner(supabase);
      if (apiKey.anonymous) {
        return { tools: allBuiltinTools(owner).filter((t) => !KB_WRITE_TOOLS.has(t.name)) };
      }
      const scopes = apiKey.cmsScopes as Set<string>;
      if (!scopes.size) throw new Error('This key has no scopes.');

      // Agent skills: public ones need 'content', internal Autopilot skills need 'settings'.
      const skillScopes = [
        ...(scopes.has('content') ? ['public', 'both', 'external'] : []),
        ...(scopes.has('settings') ? ['internal'] : []),
      ];
      const { data: skills } = skillScopes.length
        ? await supabase
          .from('agent_skills')
          .select('name, description, tool_definition, scope, category')
          .eq('enabled', true)
          .in('scope', skillScopes)
          .order('category')
        : { data: [] };

      const skillTools = (skills || []).map((s: any) => {
        const def = s.tool_definition?.function || s.tool_definition || {};
        return {
          name: s.name,
          description: `[skill] ${def.description || s.description || ''}`,
          inputSchema: def.parameters || { type: 'object', properties: {} },
        };
      });

      const builtins = allBuiltinTools(owner).filter((t) => !KB_WRITE_TOOLS.has(t.name) || scopes.has('content'));
      // Tool names must be unique: many LLM APIs reject a request with duplicate
      // function names. CMS and built-in tools win over a skill with the same name.
      const seen = new Set<string>();
      const tools = [...cmsToolsFor(scopes as any), ...builtins, ...skillTools]
        .filter((t) => (seen.has(t.name) ? false : (seen.add(t.name), true)));
      return { tools };
    }

    case 'tools/call': {
      const { name, arguments: args } = rpc.params || {};
      if (!name) throw new Error('Missing tool name');
      const scopes: Set<string> = apiKey.anonymous ? new Set() : apiKey.cmsScopes;

      // CMS tools (admin parity) — keyed operators only, checked per scope
      if (CMS_TOOL_NAMES.has(name)) {
        if (apiKey.anonymous) {
          return { content: [{ type: 'text', text: `Tool '${name}' requires an API key.` }], isError: true };
        }
        const text = await callCmsTool(supabase, name, args || {}, { scopes: scopes as any, keyName: apiKey.name || null });
        return { content: [{ type: 'text', text }], isError: text.includes('"error"') && text.length < 400 };
      }
      if (KB_WRITE_TOOLS.has(name) && !apiKey.anonymous && !scopes.has('content')) {
        return { content: [{ type: 'text', text: `${name} needs the 'content' scope.` }], isError: true };
      }

      // Built-in project tools — available to everyone (incl. anonymous)
      if (KNOWLEDGE_TOOL_NAMES.has(name)) {
        const text = await callKnowledgeTool(supabase, name, args || {}, { anonymous: !!apiKey.anonymous || !scopes.has('read'), keyName: apiKey.name || null });
        return { content: [{ type: 'text', text }], isError: text.startsWith('{"error"') };
      }
      if (PROFILE_TOOL_NAMES.has(name)) {
        const text = await callProfileTool(supabase, name, args || {}, { anonymous: !!apiKey.anonymous });
        return { content: [{ type: 'text', text }], isError: text.startsWith('{"error"') };
      }
      if (BUILTIN_TOOL_NAMES.has(name)) {
        const text = await callBuiltinTool(supabase, name, args || {}, !!apiKey.anonymous);
        return { content: [{ type: 'text', text }], isError: false };
      }

      // Skill execution requires an authenticated API key
      if (apiKey.anonymous) {
        return {
          content: [{ type: 'text', text: `Tool '${name}' requires an API key. Built-in tools (${[...PROFILE_TOOL_NAMES, ...BUILTIN_TOOL_NAMES].join(', ')}) are available anonymously.` }],
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
      const allowed = ['public', 'both', 'external'].includes(skill.scope)
        ? scopes.has('content')
        : skill.scope === 'internal' && scopes.has('settings');
      if (!allowed) {
        return {
          content: [{ type: 'text', text: `Skill '${name}' needs the '${skill.scope === 'internal' ? 'settings' : 'content'}' scope.` }],
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
          // Internal Autopilot skills only run for keys with the settings scope (checked above).
          agent_type: skill.scope === 'internal' ? 'magnet' : 'chat',
          conversation_id: `mcp-${apiKey.id}`,
        }),
      });

      const execResult = await execResp.json();
      const text = typeof execResult === 'string'
        ? execResult
        : JSON.stringify(execResult.result ?? execResult, null, 2);

      return {
        content: [{ type: 'text', text }],
        isError: !execResp.ok || !!execResult?.error,
      };
    }

    case 'resources/list': {
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
    description: 'Get the full profile as markdown: name, title, availability and every knowledge base document (roles, assignments, projects). Use it to understand background and availability when matching to consulting assignments or jobs. Use kb_list / kb_get to read single documents.',
    inputSchema: { type: 'object', properties: {} },
  },
];
const BUILTIN_TOOL_NAMES = new Set(BUILTIN_TOOLS.map(t => t.name));
const allBuiltinTools = (owner: Owner) => [...profileTools(owner), ...BUILTIN_TOOLS, ...KNOWLEDGE_TOOLS];
const KB_WRITE_TOOLS = new Set(['kb_upsert', 'kb_append', 'kb_delete']);

/** Sent in initialize: tells any agent what this server is and how to start. */
function serverInstructions(owner: Owner, apiKey: any): string {
  const site = owner.siteUrl ? ` (${owner.siteUrl})` : '';
  if (apiKey.anonymous) {
    return `Public MCP server for ${owner.name}${site}. Read the profile with get_profile, projects with list_projects / search_projects, the public knowledge base with kb_list / kb_get. analyze_job_fit scores a role against the profile; contact_owner sends ${owner.first} a message (real name and email required). An API key unlocks the CMS tools.`;
  }
  const scopes = [...(apiKey.cmsScopes as Set<string>)].join(', ') || 'none';
  return `You operate the personal CMS of ${owner.name}${site}. This key's scopes: ${scopes}.
Start every session with site_overview: it shows inquiries (the north star: clients and recruiters who make contact), traffic, the Autopilot review queue and what needs attention.
- read: inspect everything (blog_list, pages_list, analytics_summary, inbox_list, review_queue_list, kb_list …).
- content: write the knowledge base (kb_append for news, kb_upsert for whole documents; no email addresses or phone numbers in public documents), blog drafts (blog_upsert), page blocks (block_types lists the valid ones), projects.
- review: decide Autopilot work (review_decide) and publish (blog_publish, newsletter_send).
- settings: module settings, navigation, automations.
Autopilot is the internal housekeeping agent; you are the operator. Prefer small, reversible changes and say what you changed.`;
}

async function callBuiltinTool(
  supabase: any,
  name: string,
  args: any,
  anonymous = true,
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
    // Profile header + knowledge base (markdown documents) — same source as the chat.
    const profile = await loadResumeContext({ includePrivate: !anonymous });
    return profile || JSON.stringify({ error: 'Profile data is unavailable right now.' });
  }

  throw new Error(`Unknown built-in tool: ${name}`);
}


async function getProjectDetail(
  supabase: any,
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
  supabase: any,
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
