// ============================================
// A2A Delegate — Outbound A2A task delegation
// Sends tasks to external agents (e.g. SoundSpace)
// ============================================

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Registry of known A2A agents
const AGENT_REGISTRY: Record<string, { url: string; skill_id: string }> = {
  soundspace: {
    url: 'https://labyxrmiqjinatvpqoto.supabase.co/functions/v1/a2a-negotiate',
    skill_id: 'generate_track',
  },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agent, prompt, duration, context } = await req.json();
    const agentKey = (agent || 'soundspace').toLowerCase();
    const target = AGENT_REGISTRY[agentKey];

    if (!target) {
      return new Response(JSON.stringify({ error: `Unknown agent: ${agentKey}` }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Get our A2A API key for the target agent (stored in modules)
    const { data: tokenModule } = await supabase
      .from('modules')
      .select('module_config')
      .eq('module_type', 'api_tokens')
      .maybeSingle();

    const apiKey = (tokenModule?.module_config as Record<string, unknown>)?.soundspace_a2a_key as string;

    // Build A2A task payload
    const a2aPayload = {
      type: 'task',
      from: 'Magnet',
      skill_id: target.skill_id,
      input: {
        prompt: prompt || 'Chill ambient background music',
        duration: duration || 120,
        context: context || '',
      },
    };

    console.log(`[A2A Delegate] Sending task to ${agentKey}:`, a2aPayload);

    // Send A2A request
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(target.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(a2aPayload),
    });

    const result = await response.json();
    console.log(`[A2A Delegate] Response from ${agentKey}:`, result.type || result.status);

    // Log as agent activity
    await supabase.from('agent_activity').insert({
      agent: 'magnet',
      skill_name: 'a2a_delegate',
      status: response.ok ? 'success' : 'failed',
      input: a2aPayload,
      output: result,
      duration_ms: 0,
      conversation_id: `a2a:outbound:${agentKey}`,
    });

    // If completed immediately, extract the result
    if (result.status === 'completed' && result.result) {
      const musicResult = result.result;
      return new Response(JSON.stringify({
        status: 'success',
        audio_url: musicResult.audio_url || null,
        title: musicResult.title || prompt?.slice(0, 50) || 'Generated Track',
        genre: musicResult.genre || 'AI Generated',
        duration: musicResult.duration || duration || 120,
        bpm: musicResult.bpm || null,
        key: musicResult.key_scale || null,
        lyrics: musicResult.lyrics || null,
        agent: agentKey,
        a2a_task_id: result.task_id || null,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If queued/pending, return the task ID for polling
    return new Response(JSON.stringify({
      status: result.status || 'pending',
      task_id: result.task_id || null,
      message: result.message || 'Task delegated to SoundSpace agent',
      agent: agentKey,
    }), {
      status: result.status === 'error' ? 500 : 202,
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
