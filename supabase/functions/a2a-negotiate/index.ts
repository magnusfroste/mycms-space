import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const url = new URL(req.url);

  // GET /a2a-negotiate → discovery (lightweight agent card)
  if (req.method === 'GET') {
    const { data: skills } = await supabase
      .from('agent_skills')
      .select('name, description, scope, category')
      .eq('enabled', true)
      .eq('scope', 'public');

    return new Response(JSON.stringify({
      protocol: "a2a/1.0",
      agent: "Magnet",
      status: "online",
      accepts: ["task", "query", "ping"],
      skills: (skills || []).map(s => ({
        id: s.name.toLowerCase().replace(/\s+/g, '_'),
        name: s.name,
        description: s.description,
        category: s.category,
      })),
    }, null, 2), { headers: { ...corsHeaders, 'Cache-Control': 'public, max-age=60' } });
  }

  // POST → handle A2A messages
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: corsHeaders,
    });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: corsHeaders,
    });
  }

  const { type, from, skill_id, input, task_id } = body as {
    type?: string;
    from?: string;
    skill_id?: string;
    input?: Record<string, unknown>;
    task_id?: string;
  };

  // --- PING: health check for federation ---
  if (type === 'ping') {
    return new Response(JSON.stringify({
      type: 'pong',
      agent: 'Magnet',
      protocol: 'a2a/1.0',
      timestamp: new Date().toISOString(),
    }), { headers: corsHeaders });
  }

  // --- QUERY: check if a skill is available ---
  if (type === 'query') {
    if (!skill_id) {
      return new Response(JSON.stringify({ error: 'skill_id required' }), {
        status: 400, headers: corsHeaders,
      });
    }

    const { data: skills } = await supabase
      .from('agent_skills')
      .select('name, description, scope, category, requires_approval')
      .eq('enabled', true)
      .eq('scope', 'public');

    const match = (skills || []).find(
      s => s.name.toLowerCase().replace(/\s+/g, '_') === skill_id
    );

    if (!match) {
      return new Response(JSON.stringify({
        type: 'query_response',
        available: false,
        skill_id,
      }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({
      type: 'query_response',
      available: true,
      skill: {
        id: skill_id,
        name: match.name,
        description: match.description,
        category: match.category,
        requires_approval: match.requires_approval,
      },
    }), { headers: corsHeaders });
  }

  // --- TASK: delegate a task to Magnet ---
  if (type === 'task') {
    if (!skill_id || !input) {
      return new Response(JSON.stringify({ error: 'skill_id and input required' }), {
        status: 400, headers: corsHeaders,
      });
    }

    // Verify skill exists and is public
    const { data: skills } = await supabase
      .from('agent_skills')
      .select('id, name, scope, requires_approval')
      .eq('enabled', true)
      .eq('scope', 'public');

    const match = (skills || []).find(
      s => s.name.toLowerCase().replace(/\s+/g, '_') === skill_id
    );

    if (!match) {
      return new Response(JSON.stringify({
        type: 'task_response',
        status: 'rejected',
        reason: `Skill '${skill_id}' not available`,
      }), { status: 404, headers: corsHeaders });
    }

    // Create task in agent_tasks for processing
    const { data: task, error } = await supabase
      .from('agent_tasks')
      .insert({
        task_type: 'a2a_delegation',
        status: match.requires_approval ? 'pending_approval' : 'pending',
        input_data: {
          skill_id,
          skill_name: match.name,
          from_agent: from || 'unknown',
          input,
        },
      })
      .select('id, status')
      .single();

    if (error) {
      return new Response(JSON.stringify({
        type: 'task_response',
        status: 'error',
        reason: 'Failed to create task',
      }), { status: 500, headers: corsHeaders });
    }

    // Log activity
    await supabase.from('agent_activity').insert({
      skill_name: 'a2a_negotiate',
      skill_id: match.id,
      status: 'success',
      agent: 'magnet',
      input: { type: 'task', from, skill_id },
      output: { task_id: task.id, task_status: task.status },
    });

    return new Response(JSON.stringify({
      type: 'task_response',
      status: task.status === 'pending_approval' ? 'accepted_pending_approval' : 'accepted',
      task_id: task.id,
      message: task.status === 'pending_approval'
        ? 'Task queued for human approval before execution'
        : 'Task accepted and queued for execution',
    }), { status: 202, headers: corsHeaders });
  }

  // --- STATUS: check task status ---
  if (type === 'status') {
    if (!task_id) {
      return new Response(JSON.stringify({ error: 'task_id required' }), {
        status: 400, headers: corsHeaders,
      });
    }

    const { data: task } = await supabase
      .from('agent_tasks')
      .select('id, status, output_data, completed_at')
      .eq('id', task_id)
      .single();

    if (!task) {
      return new Response(JSON.stringify({
        type: 'status_response',
        task_id,
        status: 'not_found',
      }), { status: 404, headers: corsHeaders });
    }

    return new Response(JSON.stringify({
      type: 'status_response',
      task_id: task.id,
      status: task.status,
      output: task.status === 'completed' ? task.output_data : undefined,
      completed_at: task.completed_at,
    }), { headers: corsHeaders });
  }

  return new Response(JSON.stringify({
    error: 'Unknown message type. Supported: ping, query, task, status',
  }), { status: 400, headers: corsHeaders });
});
