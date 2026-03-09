// ============================================
// A2A Delegate — Dynamic outbound task delegation
// Reads federation agents from agent_skills (scope='federation')
// Handler format: a2a:<endpoint_url>
// ============================================

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agent, skill_id, input, prompt, duration, context } = await req.json();
    const agentKey = (agent || '').toLowerCase();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Find federation skill matching the agent name
    const { data: skills, error: skillError } = await supabase
      .from('agent_skills')
      .select('*')
      .eq('scope', 'federation')
      .eq('enabled', true);

    if (skillError) throw skillError;

    // Match by agent name in skill name (e.g. "SoundSpace: Generate Track")
    // or by exact skill_id from tool_definition
    const match = (skills || []).find(s => {
      const nameMatch = s.name.toLowerCase().includes(agentKey);
      const toolDef = s.tool_definition as Record<string, unknown> | null;
      const idMatch = skill_id && toolDef?.skill_id === skill_id;
      return nameMatch || idMatch;
    });

    if (!match) {
      return new Response(JSON.stringify({ error: `No federation agent found for: ${agentKey || skill_id}` }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract endpoint URL from handler (format: "a2a:https://...")
    const handlerUrl = match.handler.replace(/^a2a:/, '');
    if (!handlerUrl.startsWith('http')) {
      return new Response(JSON.stringify({ error: `Invalid federation handler: ${match.handler}` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get API key from modules.api_tokens (keyed by agent name)
    const { data: tokenModule } = await supabase
      .from('modules')
      .select('module_config')
      .eq('module_type', 'api_tokens')
      .maybeSingle();

    const tokens = (tokenModule?.module_config as Record<string, unknown>) || {};
    const toolDef = (match.tool_definition as Record<string, unknown>) || {};
    const tokenKey = (toolDef.api_token_key as string) || `${agentKey}_a2a_key`;
    const apiKey = tokens[tokenKey] as string | undefined;

    // Build A2A task payload
    const targetSkillId = skill_id || (toolDef.skill_id as string) || agentKey;
    const a2aPayload = {
      type: 'task',
      from: 'Magnet',
      skill_id: targetSkillId,
      input: input || {
        prompt: prompt || 'Default task',
        duration: duration || undefined,
        context: context || '',
      },
    };

    console.log(`[A2A Delegate] Sending to ${match.name} at ${handlerUrl}:`, a2aPayload);

    // Send A2A request
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const startMs = Date.now();
    const response = await fetch(handlerUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(a2aPayload),
    });
    const durationMs = Date.now() - startMs;

    const result = await response.json();
    console.log(`[A2A Delegate] Response from ${match.name} (${response.status}):`, result.type || result.status);

    // Log as agent activity
    await supabase.from('agent_activity').insert({
      agent: 'magnet',
      skill_name: 'a2a_delegate',
      skill_id: match.id,
      status: response.ok ? 'success' : 'failed',
      input: a2aPayload,
      output: result,
      duration_ms: durationMs,
      conversation_id: `a2a:outbound:${agentKey}`,
      error_message: response.ok ? null : `HTTP ${response.status}: ${result.error || result.reason || 'Unknown error'}`,
    });

    // Return generic response — no agent-specific parsing
    if (result.status === 'completed' && result.result) {
      return new Response(JSON.stringify({
        status: 'success',
        agent: match.name,
        skill_id: targetSkillId,
        result: result.result,
        task_id: result.task_id || null,
        duration_ms: durationMs,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Queued/pending/error — pass through
    return new Response(JSON.stringify({
      status: result.status || 'pending',
      agent: match.name,
      skill_id: targetSkillId,
      task_id: result.task_id || null,
      message: result.message || `Task delegated to ${match.name}`,
      result: result.result || null,
      duration_ms: durationMs,
    }), {
      status: result.status === 'error' ? 500 : (response.ok ? 200 : 202),
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[A2A Delegate] Error:', err);
    return new Response(JSON.stringify({
      error: (err as Error).message || 'Failed to delegate task',
    }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
