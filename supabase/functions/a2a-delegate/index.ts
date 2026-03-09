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

    // Retry config for transient errors
    const RETRYABLE_STATUSES = [429, 502, 503];
    const MAX_RETRIES = 3;
    const BASE_DELAY_MS = 1000;

    const startMs = Date.now();
    let response: Response | null = null;
    let lastNetworkError: Error | null = null;
    let attempt = 0;

    while (attempt <= MAX_RETRIES) {
      attempt++;
      try {
        response = await fetch(handlerUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(a2aPayload),
        });

        // If success or non-retryable error, break
        if (response.ok || !RETRYABLE_STATUSES.includes(response.status)) {
          break;
        }

        // Retryable HTTP error
        const retryAfter = response.status === 429
          ? parseInt(response.headers.get('Retry-After') || '0', 10) * 1000
          : 0;
        const delay = Math.max(retryAfter, BASE_DELAY_MS * Math.pow(2, attempt - 1));

        // Consume body to avoid resource leak
        await response.text();

        if (attempt <= MAX_RETRIES) {
          console.warn(`[A2A Delegate] Retry ${attempt}/${MAX_RETRIES} for ${match.name} (HTTP ${response.status}), waiting ${delay}ms`);
          await new Promise(r => setTimeout(r, delay));
          response = null; // Reset for next attempt
        }
      } catch (networkErr) {
        lastNetworkError = networkErr as Error;
        if (attempt <= MAX_RETRIES) {
          const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
          console.warn(`[A2A Delegate] Network retry ${attempt}/${MAX_RETRIES} for ${match.name}: ${lastNetworkError.message}, waiting ${delay}ms`);
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }

    // All retries exhausted with network error
    if (!response) {
      const errMsg = `Network error connecting to ${match.name} after ${attempt} attempts: ${lastNetworkError?.message || 'Unknown'}`;
      console.error(`[A2A Delegate] ${errMsg}`);
      await supabase.from('agent_activity').insert({
        agent: 'magnet',
        skill_name: 'a2a_delegate',
        skill_id: match.id,
        status: 'failed',
        input: a2aPayload,
        output: { error_type: 'network', message: errMsg, attempts: attempt },
        duration_ms: Date.now() - startMs,
        conversation_id: `a2a:outbound:${agentKey}`,
        error_message: errMsg,
      });
      return new Response(JSON.stringify({ error: errMsg, error_type: 'network', attempts: attempt }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const durationMs = Date.now() - startMs;

    // Parse response body safely
    let result: Record<string, unknown>;
    const rawBody = await response.text();
    try {
      result = JSON.parse(rawBody);
    } catch {
      const errMsg = `Invalid JSON from ${match.name} (HTTP ${response.status}): ${rawBody.slice(0, 200)}`;
      console.error(`[A2A Delegate] ${errMsg}`);
      await supabase.from('agent_activity').insert({
        agent: 'magnet', skill_name: 'a2a_delegate', skill_id: match.id,
        status: 'failed', input: a2aPayload,
        output: { error_type: 'parse', http_status: response.status, raw: rawBody.slice(0, 500) },
        duration_ms: durationMs, conversation_id: `a2a:outbound:${agentKey}`,
        error_message: errMsg,
      });
      return new Response(JSON.stringify({ error: errMsg, error_type: 'parse' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Classify error type for structured logging
    let errorType: string | null = null;
    let errorMessage: string | null = null;

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        errorType = 'auth';
        errorMessage = `Auth rejected by ${match.name} (HTTP ${response.status}). Check API key '${tokenKey}' in API Tokens module.`;
      } else if (response.status === 429) {
        errorType = 'rate_limit';
        errorMessage = `Rate limited by ${match.name} after ${attempt} attempts (HTTP 429).`;
      } else if (response.status >= 500) {
        errorType = 'upstream';
        errorMessage = `Upstream error from ${match.name} after ${attempt} attempts (HTTP ${response.status}): ${result.error || result.reason || 'Internal error'}`;
      } else {
        errorType = 'client';
        errorMessage = `Request rejected by ${match.name} (HTTP ${response.status}): ${result.error || result.reason || 'Unknown'}`;
      }
      console.warn(`[A2A Delegate] ${errorType.toUpperCase()}: ${errorMessage}`);
    } else {
      console.log(`[A2A Delegate] OK from ${match.name} (${response.status}, ${durationMs}ms):`, result.type || result.status);
    }

    // Log as agent activity
    await supabase.from('agent_activity').insert({
      agent: 'magnet',
      skill_name: 'a2a_delegate',
      skill_id: match.id,
      status: response.ok ? 'success' : 'failed',
      input: a2aPayload,
      output: { ...result, _http_status: response.status, _error_type: errorType },
      duration_ms: durationMs,
      conversation_id: `a2a:outbound:${agentKey}`,
      error_message: errorMessage,
    });

    // Auth/rate-limit errors — return clear error to caller
    if (errorType === 'auth') {
      return new Response(JSON.stringify({
        status: 'error', error_type: 'auth', agent: match.name,
        message: errorMessage, http_status: response.status,
      }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (errorType === 'rate_limit') {
      return new Response(JSON.stringify({
        status: 'error', error_type: 'rate_limit', agent: match.name,
        message: errorMessage, retry_after: 60,
      }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' } });
    }
    if (errorType === 'upstream') {
      return new Response(JSON.stringify({
        status: 'error', error_type: 'upstream', agent: match.name,
        message: errorMessage, http_status: response.status,
      }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (errorType) {
      return new Response(JSON.stringify({
        status: 'error', error_type: errorType, agent: match.name,
        message: errorMessage, http_status: response.status,
      }), { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Success — completed immediately
    if (result.status === 'completed' && result.result) {
      return new Response(JSON.stringify({
        status: 'success', agent: match.name, skill_id: targetSkillId,
        result: result.result, task_id: result.task_id || null, duration_ms: durationMs,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Queued/pending — pass through
    return new Response(JSON.stringify({
      status: result.status || 'pending', agent: match.name, skill_id: targetSkillId,
      task_id: result.task_id || null, message: result.message || `Task delegated to ${match.name}`,
      result: result.result || null, duration_ms: durationMs,
    }), { status: 202, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('[A2A Delegate] Unhandled error:', err);
    return new Response(JSON.stringify({
      error: (err as Error).message || 'Failed to delegate task',
      error_type: 'internal',
    }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
