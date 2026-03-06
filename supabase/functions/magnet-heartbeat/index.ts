// ============================================
// Magnet Heartbeat — Autonomous Agent Loop
// Scheduled: reflect → objectives → act → remember
// ============================================

import { createClient } from "npm:@supabase/supabase-js@2";
import { loadAgentMemory, formatMemoryForPrompt, upsertMemory } from "../_shared/ai-context.ts";
import { resolveProvider, callOpenAICompatible } from "../_shared/ai-agent.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MAX_ITERATIONS = 8;

// ─── Context loaders ──────────────────────────────────────────────────────────

async function loadObjectives(supabase: any): Promise<string> {
  const { data } = await supabase
    .from('agent_objectives')
    .select('id, goal, status, constraints, success_criteria, progress')
    .eq('status', 'active')
    .order('created_at', { ascending: false }).limit(10);
  if (!data?.length) return '\nNo active objectives.';
  return '\n\nActive objectives:\n' + data.map((o: any) =>
    `- [${o.id.slice(0, 8)}] "${o.goal}" | progress: ${JSON.stringify(o.progress)} | criteria: ${JSON.stringify(o.success_criteria)}`
  ).join('\n');
}

async function loadRecentActivity(supabase: any): Promise<string> {
  const since = new Date();
  since.setDate(since.getDate() - 1);
  const { data } = await supabase
    .from('agent_activity')
    .select('skill_name, status, error_message, created_at')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false }).limit(20);
  if (!data?.length) return '\nNo activity in the last 24 hours.';
  return '\n\nRecent activity (24h):\n' + data.map((a: any) =>
    `- ${a.skill_name}: ${a.status}${a.error_message ? ` (${a.error_message})` : ''}`
  ).join('\n');
}

async function loadLinkedAutomations(supabase: any): Promise<string> {
  const { data } = await supabase
    .from('agent_automations')
    .select('id, name, skill_name, trigger_type, trigger_config, skill_arguments, objective_id, enabled, last_triggered_at, next_run_at, run_count, last_error')
    .eq('enabled', true)
    .order('objective_id', { ascending: false }); // objective-linked first
  if (!data?.length) return '\nNo enabled automations.';
  const linked = data.filter((a: any) => a.objective_id);
  const unlinked = data.filter((a: any) => !a.objective_id);
  let out = '\n\nEnabled automations (objective-linked FIRST — prioritize these):';
  for (const a of linked) {
    out += `\n- ⭐ [${a.id.slice(0, 8)}] "${a.name}" → skill: ${a.skill_name} | objective: ${a.objective_id.slice(0, 8)} | runs: ${a.run_count} | last_error: ${a.last_error || 'none'}`;
  }
  for (const a of unlinked) {
    out += `\n- [${a.id.slice(0, 8)}] "${a.name}" → skill: ${a.skill_name} | runs: ${a.run_count}`;
  }
  return out;
}

async function loadSiteStats(supabase: any): Promise<string> {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const [views, messages, posts, subscribers] = await Promise.all([
    supabase.from('page_views').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString()),
    supabase.from('contact_messages').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString()),
    supabase.from('blog_posts').select('id', { count: 'exact', head: true }).eq('status', 'published').gte('published_at', weekAgo.toISOString()),
    supabase.from('newsletter_subscribers').select('id', { count: 'exact', head: true }).eq('status', 'active'),
  ]);
  return `\n\nSite stats (7 days):\n- Page views: ${views.count ?? 0}\n- Contact messages: ${messages.count ?? 0}\n- Published posts: ${posts.count ?? 0}\n- Active subscribers: ${subscribers.count ?? 0}`;
}

// ─── Built-in tool handlers for heartbeat ─────────────────────────────────────

async function handleHeartbeatTool(supabase: any, supabaseUrl: string, serviceKey: string, fnName: string, args: any): Promise<any> {
  // Memory write
  if (fnName === 'memory_write') {
    const { key, value, category = 'context' } = args;
    const content = typeof value === 'object' ? JSON.stringify(value) : String(value);
    await upsertMemory(category, key, content);
    return { status: 'saved', key };
  }

  // Objective progress
  if (fnName === 'objective_update_progress') {
    const { error } = await supabase.from('agent_objectives')
      .update({ progress: args.progress }).eq('id', args.objective_id);
    return error ? { status: 'error', error: error.message } : { status: 'updated' };
  }

  // Objective complete
  if (fnName === 'objective_complete') {
    const { error } = await supabase.from('agent_objectives')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', args.objective_id);
    return error ? { status: 'error', error: error.message } : { status: 'completed' };
  }

  // Reflect
  if (fnName === 'reflect') {
    const since = new Date();
    since.setDate(since.getDate() - 7);
    const { data: activity } = await supabase.from('agent_activity')
      .select('skill_name, status, duration_ms, error_message')
      .gte('created_at', since.toISOString()).limit(100);
    const stats: Record<string, { count: number; errors: number }> = {};
    for (const a of (activity || [])) {
      const n = a.skill_name || 'unknown';
      if (!stats[n]) stats[n] = { count: 0, errors: 0 };
      stats[n].count++;
      if (a.status === 'failed') stats[n].errors++;
    }
    const { data: objectives } = await supabase.from('agent_objectives').select('goal, status, progress');
    return { period: '7 days', total_actions: (activity || []).length, skill_usage: stats, objectives: objectives || [] };
  }

  // Delegate to agent-execute for skill-based tools
  const response = await fetch(`${supabaseUrl}/functions/v1/agent-execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceKey}` },
    body: JSON.stringify({ skill_name: fnName, arguments: args, agent_type: 'magnet' }),
  });
  return await response.json();
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);
  const startTime = Date.now();

  try {
    // 1. Gather context in parallel
    const [agentMemory, objectiveCtx, activityCtx, statsCtx] = await Promise.all([
      loadAgentMemory(),
      loadObjectives(supabase),
      loadRecentActivity(supabase),
      loadSiteStats(supabase),
    ]);

    // 2. Resolve AI provider
    const { data: aiModule } = await supabase.from('modules')
      .select('module_config').eq('module_type', 'ai').maybeSingle();
    const aiConfig = (aiModule?.module_config as any) || {};
    const provider = aiConfig.active_integration || 'lovable';

    const { url, apiKey, model } = resolveProvider({
      provider,
      model: aiConfig.integration?.[provider]?.model,
      webhookUrl: aiConfig.webhook_url,
      baseUrl: aiConfig.integration?.[provider]?.base_url,
      apiKeyEnv: aiConfig.integration?.[provider]?.api_key_env,
    });

    // 3. Load skills as tools
    const { data: skills } = await supabase.from('agent_skills')
      .select('name, tool_definition, scope')
      .eq('enabled', true).in('scope', ['internal', 'both']);

    const skillTools = (skills || [])
      .filter((s: any) => s.tool_definition?.function)
      .map((s: any) => s.tool_definition);

    const builtInTools = [
      { type: 'function', function: { name: 'memory_write', description: 'Save to persistent memory.', parameters: { type: 'object', properties: { key: { type: 'string' }, value: { description: 'Info to remember' }, category: { type: 'string', enum: ['preference', 'context', 'fact'] } }, required: ['key', 'value'] } } },
      { type: 'function', function: { name: 'objective_update_progress', description: 'Update progress on an objective.', parameters: { type: 'object', properties: { objective_id: { type: 'string' }, progress: { type: 'object' } }, required: ['objective_id', 'progress'] } } },
      { type: 'function', function: { name: 'objective_complete', description: 'Mark objective as completed.', parameters: { type: 'object', properties: { objective_id: { type: 'string' } }, required: ['objective_id'] } } },
      { type: 'function', function: { name: 'reflect', description: 'Analyze performance over past 7 days.', parameters: { type: 'object', properties: { focus: { type: 'string', enum: ['errors', 'usage', 'automations', 'objectives'] } } } } },
    ];

    const allTools = [...builtInTools, ...skillTools];

    const memoryPrompt = agentMemory.length ? formatMemoryForPrompt(agentMemory) : '';

    const systemPrompt = `You are Magnet running in AUTONOMOUS HEARTBEAT mode. No human is watching.

Your mission: Review system state, advance objectives, take needed actions.
${memoryPrompt}
${objectiveCtx}
${activityCtx}
${statsCtx}

HEARTBEAT PROTOCOL:
1. REFLECT — Analyze past 7 days
2. OBJECTIVES — Review each active objective. Update progress. Mark complete if criteria met.
3. ACT — If an objective needs action and you have the skill, DO IT.
4. REMEMBER — Save any learnings to memory.
5. SUMMARIZE — Brief heartbeat report.

CONSTRAINTS:
- Max ${MAX_ITERATIONS} tool iterations
- Do NOT send newsletters without approval
- Be efficient: only act when progress is needed`;

    // 4. Run agentic loop
    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Heartbeat triggered at ${new Date().toISOString()}. Review objectives and system health.` },
    ];

    let finalResponse = '';
    const actionsExecuted: string[] = [];

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const aiData = await callOpenAICompatible({
        url, apiKey, model, messages,
        tools: allTools.length > 0 ? allTools : undefined,
      });

      const choice = aiData.choices?.[0];
      if (!choice) throw new Error('No AI response');
      const msg = choice.message;

      if (!msg.tool_calls?.length) {
        finalResponse = msg.content || 'Heartbeat complete.';
        break;
      }

      messages.push(msg);

      for (const tc of msg.tool_calls!) {
        const fnName = tc.function?.name || '';
        let fnArgs: any;
        try { fnArgs = JSON.parse(tc.function?.arguments || '{}'); } catch { fnArgs = {}; }
        console.log(`[heartbeat] Executing: ${fnName}`);
        actionsExecuted.push(fnName);

        let result: any;
        try {
          result = await handleHeartbeatTool(supabase, supabaseUrl, serviceKey, fnName, fnArgs);
        } catch (err: any) {
          result = { error: err.message };
        }

        messages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(result) });
      }
    }

    const duration = Date.now() - startTime;

    // Log heartbeat
    await supabase.from('agent_activity').insert({
      agent: 'magnet', skill_name: 'heartbeat',
      input: { trigger: 'scheduled', actions: actionsExecuted },
      output: { summary: finalResponse.slice(0, 2000) },
      status: 'success', duration_ms: duration,
    });

    console.log(`[heartbeat] Complete in ${duration}ms, ${actionsExecuted.length} actions`);

    return new Response(JSON.stringify({
      status: 'ok', duration_ms: duration,
      actions: actionsExecuted, summary: finalResponse.slice(0, 500),
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err: any) {
    const duration = Date.now() - startTime;
    console.error('[heartbeat] Error:', err);
    await supabase.from('agent_activity').insert({
      agent: 'magnet', skill_name: 'heartbeat',
      input: { trigger: 'scheduled' }, output: {},
      status: 'failed', error_message: err.message || 'Unknown', duration_ms: duration,
    });
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
