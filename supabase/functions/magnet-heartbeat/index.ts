// ============================================
// Magnet Heartbeat — Autonomous Agent Loop
// Scheduled: reflect → signals → objectives → automations → act → heal → remember
// ============================================

import { createClient } from "npm:@supabase/supabase-js@2";
import { loadAgentMemory, formatMemoryForPrompt, upsertMemory } from "../_shared/ai-context.ts";
import { resolveProvider, callOpenAICompatible } from "../_shared/ai-agent.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MAX_ITERATIONS = 8;
const SELF_HEAL_THRESHOLD = 3; // consecutive failures before auto-disable

// ─── Cron helpers ─────────────────────────────────────────────────────────────

function calculateNextRun(cronExpr: string): string | null {
  try {
    const parts = cronExpr.trim().split(/\s+/);
    if (parts.length < 5) return null;

    const now = new Date();
    // Simple interval estimation from cron pattern
    const [min, hour, dayOfMonth, , ] = parts;

    if (min === '*' && hour === '*') {
      // Every minute — next run = now + 1 min
      return new Date(now.getTime() + 60_000).toISOString();
    }
    if (min.startsWith('*/')) {
      const interval = parseInt(min.slice(2), 10);
      return new Date(now.getTime() + interval * 60_000).toISOString();
    }
    if (hour.startsWith('*/')) {
      const interval = parseInt(hour.slice(2), 10);
      return new Date(now.getTime() + interval * 3600_000).toISOString();
    }
    if (hour !== '*' && min !== '*') {
      // Specific time — next occurrence
      const targetHour = parseInt(hour, 10);
      const targetMin = parseInt(min, 10);
      const next = new Date(now);
      next.setHours(targetHour, targetMin, 0, 0);
      if (next <= now) next.setDate(next.getDate() + 1);
      if (dayOfMonth !== '*') {
        const targetDay = parseInt(dayOfMonth, 10);
        next.setDate(targetDay);
        if (next <= now) next.setMonth(next.getMonth() + 1);
      }
      return next.toISOString();
    }
    // Default: 12 hours from now
    return new Date(now.getTime() + 12 * 3600_000).toISOString();
  } catch {
    return new Date(Date.now() + 12 * 3600_000).toISOString();
  }
}

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
    .order('objective_id', { ascending: false });
  if (!data?.length) return '\nNo enabled automations.';
  const now = new Date();
  const linked = data.filter((a: any) => a.objective_id);
  const unlinked = data.filter((a: any) => !a.objective_id);
  let out = '\n\nEnabled automations (objective-linked ⭐ FIRST — prioritize these):';
  for (const a of linked) {
    const due = a.next_run_at && new Date(a.next_run_at) <= now ? ' ⏰ DUE' : '';
    out += `\n- ⭐${due} [${a.id.slice(0, 8)}] "${a.name}" → skill: ${a.skill_name} | objective: ${a.objective_id.slice(0, 8)} | runs: ${a.run_count} | last_error: ${a.last_error || 'none'}`;
  }
  for (const a of unlinked) {
    const due = a.next_run_at && new Date(a.next_run_at) <= now ? ' ⏰ DUE' : '';
    out += `\n-${due} [${a.id.slice(0, 8)}] "${a.name}" → skill: ${a.skill_name} | runs: ${a.run_count}`;
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

async function loadPendingSignals(supabase: any): Promise<string> {
  const { data } = await supabase
    .from('agent_tasks')
    .select('id, task_type, input_data, created_at')
    .eq('task_type', 'signal')
    .eq('status', 'pending')
    .order('created_at', { ascending: true }).limit(10);
  if (!data?.length) return '\nNo pending signals.';
  return '\n\n🚨 Pending signals (act on these NOW):\n' + data.map((t: any) =>
    `- [${t.id.slice(0, 8)}] ${t.input_data?.title || t.input_data?.event || 'Unknown'} (${t.created_at})`
  ).join('\n');
}

// ─── Self-healing: detect and disable failing skills ──────────────────────────

async function runSelfHealing(supabase: any): Promise<string> {
  // Find skills with 3+ consecutive recent failures
  const since = new Date();
  since.setDate(since.getDate() - 3);
  const { data: recentActivity } = await supabase
    .from('agent_activity')
    .select('skill_name, status, created_at')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false }).limit(200);

  if (!recentActivity?.length) return '';

  // Group by skill and check for consecutive failures
  const skillStreaks: Record<string, number> = {};
  const checked = new Set<string>();

  for (const a of recentActivity) {
    const name = a.skill_name;
    if (checked.has(name)) continue;
    if (a.status === 'failed') {
      skillStreaks[name] = (skillStreaks[name] || 0) + 1;
    } else {
      checked.add(name); // first non-failure breaks the streak
    }
  }

  const toDisable = Object.entries(skillStreaks)
    .filter(([, count]) => count >= SELF_HEAL_THRESHOLD)
    .map(([name]) => name);

  if (!toDisable.length) return '';

  // Auto-disable these skills
  for (const skillName of toDisable) {
    await supabase.from('agent_skills')
      .update({ enabled: false })
      .eq('name', skillName);
    console.log(`[self-heal] Auto-disabled skill: ${skillName} (${skillStreaks[skillName]} consecutive failures)`);
  }

  // Also disable linked automations
  for (const skillName of toDisable) {
    await supabase.from('agent_automations')
      .update({ enabled: false, last_error: `Auto-disabled: ${SELF_HEAL_THRESHOLD}+ consecutive failures` })
      .eq('skill_name', skillName)
      .eq('enabled', true);
  }

  return `\n\n⚠️ Self-healing: Auto-disabled ${toDisable.length} skills due to repeated failures: ${toDisable.join(', ')}`;
}

// ─── Plan Decomposition via AI ────────────────────────────────────────────────

async function decomposeObjectiveIntoPlan(
  objective: { id: string; goal: string; constraints: any; success_criteria: any },
  supabase: any,
): Promise<{ steps: any[]; total_steps: number }> {
  // Load available skills to inform step generation
  const { data: skills } = await supabase.from('agent_skills')
    .select('name, description, category, handler')
    .eq('enabled', true);

  const skillList = (skills || []).map((s: any) => `- ${s.name}: ${s.description} (${s.handler})`).join('\n');

  const { url, apiKey, model } = resolveProvider({ provider: 'lovable' as const });
  const data = await callOpenAICompatible({
    url, apiKey, model,
    messages: [
      {
        role: 'system',
        content: `You are a planning agent. Decompose an objective into 3-7 concrete, sequential steps. Each step should map to an available skill or automation when possible.

Available skills:
${skillList}

Return ONLY a JSON array, no markdown. Each step:
{"id":"s1","order":1,"description":"What to do","skill_name":"skill_name_or_null","skill_args":{},"status":"pending"}

Rules:
- Steps should be ordered logically (research before drafting, drafting before publishing)
- Use actual skill names from the list above when applicable
- Set skill_args with sensible defaults based on the objective
- If no skill matches, set skill_name to null (manual step)
- Keep descriptions short and actionable`,
      },
      {
        role: 'user',
        content: `Objective: "${objective.goal}"
Constraints: ${JSON.stringify(objective.constraints || {})}
Success criteria: ${JSON.stringify(objective.success_criteria || {})}`,
      },
    ],
  });

  const raw = data.choices?.[0]?.message?.content || '[]';
  const cleaned = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
  let steps: any[];
  try {
    steps = JSON.parse(cleaned);
    if (!Array.isArray(steps)) steps = [];
  } catch {
    steps = [{ id: 's1', order: 1, description: objective.goal, skill_name: null, skill_args: {}, status: 'pending' }];
  }

  // Ensure all steps have required fields
  steps = steps.map((s: any, i: number) => ({
    id: s.id || `s${i + 1}`,
    order: s.order || i + 1,
    description: s.description || `Step ${i + 1}`,
    skill_name: s.skill_name || null,
    skill_args: s.skill_args || {},
    status: 'pending',
  }));

  return { steps, total_steps: steps.length };
}

// ─── Built-in tool handlers ──────────────────────────────────────────────────

async function handleHeartbeatTool(supabase: any, supabaseUrl: string, serviceKey: string, fnName: string, args: any): Promise<any> {
  // Decompose objective into multi-step plan
  if (fnName === 'decompose_objective') {
    const { objective_id } = args;
    const { data: obj, error } = await supabase.from('agent_objectives')
      .select('id, goal, constraints, success_criteria, progress')
      .eq('id', objective_id).single();
    if (error || !obj) return { status: 'error', error: error?.message || 'Objective not found' };

    const plan = await decomposeObjectiveIntoPlan(obj, supabase);
    const progress = (obj.progress as Record<string, any>) || {};
    progress.plan = { ...plan, current_step: 0, created_at: new Date().toISOString() };

    await supabase.from('agent_objectives').update({ progress }).eq('id', objective_id);
    return { status: 'planned', objective_id, steps: plan.steps.length, plan: plan.steps };
  }

  // Advance plan: execute next pending step
  if (fnName === 'advance_plan') {
    const { objective_id } = args;
    const { data: obj, error } = await supabase.from('agent_objectives')
      .select('id, goal, progress')
      .eq('id', objective_id).single();
    if (error || !obj) return { status: 'error', error: error?.message || 'Objective not found' };

    const progress = (obj.progress as Record<string, any>) || {};
    const plan = progress.plan;
    if (!plan?.steps?.length) return { status: 'no_plan', message: 'No plan found. Use decompose_objective first.' };

    // Find next pending step
    const nextStep = plan.steps.find((s: any) => s.status === 'pending');
    if (!nextStep) return { status: 'all_done', message: 'All plan steps completed.' };

    // Mark step as running
    nextStep.status = 'running';
    plan.current_step = nextStep.order;
    await supabase.from('agent_objectives').update({ progress }).eq('id', objective_id);

    // Execute the step's skill
    let result: any = { status: 'manual', message: 'No skill mapped — requires manual action.' };
    if (nextStep.skill_name) {
      try {
        const resp = await fetch(`${supabaseUrl}/functions/v1/agent-execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceKey}` },
          body: JSON.stringify({
            skill_name: nextStep.skill_name,
            arguments: nextStep.skill_args || {},
            agent_type: 'magnet',
          }),
        });
        result = await resp.json();
      } catch (err: any) {
        result = { error: err.message };
      }
    }

    // Update step status
    const success = !result.error && result.status !== 'failed';
    nextStep.status = success ? 'done' : 'failed';
    nextStep.result = result;
    nextStep.completed_at = new Date().toISOString();

    // Check if all steps are done
    const allDone = plan.steps.every((s: any) => s.status === 'done');
    const anyFailed = plan.steps.some((s: any) => s.status === 'failed');
    plan.completed = allDone;
    plan.has_failures = anyFailed;

    // Update progress
    progress.plan = plan;
    progress.total_runs = (progress.total_runs || 0) + 1;
    progress.last_updated = new Date().toISOString();
    await supabase.from('agent_objectives').update({ progress }).eq('id', objective_id);

    const remaining = plan.steps.filter((s: any) => s.status === 'pending').length;
    return {
      status: success ? 'step_completed' : 'step_failed',
      step: nextStep.description,
      skill: nextStep.skill_name,
      result,
      remaining_steps: remaining,
      plan_completed: allDone,
    };
  }

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

  // Mark signal as processed
  if (fnName === 'signal_acknowledge') {
    const { task_id, output } = args;
    const { error } = await supabase.from('agent_tasks')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        output_data: output || { acknowledged: true },
      })
      .eq('id', task_id);
    return error ? { status: 'error', error: error.message } : { status: 'acknowledged' };
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

  // Execute automation with next_run_at calculation
  if (fnName === 'execute_automation') {
    const { automation_id } = args;
    const { data: auto, error: fetchErr } = await supabase.from('agent_automations')
      .select('*').eq('id', automation_id).maybeSingle();
    if (fetchErr || !auto) return { status: 'error', error: fetchErr?.message || 'Automation not found' };

    // Check if the linked skill requires approval
    if (auto.skill_name) {
      const { data: skill } = await supabase.from('agent_skills')
        .select('requires_approval').eq('name', auto.skill_name).maybeSingle();
      if (skill?.requires_approval) {
        // Log as pending_approval instead of executing
        await supabase.from('agent_activity').insert({
          agent: 'magnet', skill_name: auto.skill_name,
          input: { automation_id, arguments: auto.skill_arguments },
          output: { reason: 'Skill requires admin approval before execution' },
          status: 'pending_approval',
        });
        // Send email notification to admin
        const { notifyPendingApproval } = await import("../_shared/notify-approval.ts");
        await notifyPendingApproval(auto.skill_name, 'Automation-triggered skill requires admin approval.');
        return { status: 'pending_approval', skill: auto.skill_name, message: 'This skill requires admin approval. Logged for review.' };
      }
    }

    // Delegate skill execution to agent-execute
    let skillResult: any;
    try {
      const resp = await fetch(`${supabaseUrl}/functions/v1/agent-execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceKey}` },
        body: JSON.stringify({
          skill_name: auto.skill_name,
          arguments: auto.skill_arguments || {},
          agent_type: 'magnet',
          objective_id: auto.objective_id || undefined,
        }),
      });
      skillResult = await resp.json();
    } catch (err: any) {
      skillResult = { error: err.message };
    }

    // Calculate next_run_at from cron expression
    let nextRun: string | null = null;
    if (auto.trigger_type === 'cron' && auto.trigger_config?.cron) {
      nextRun = calculateNextRun(auto.trigger_config.cron);
    }

    // Update automation metadata
    const updatePayload: Record<string, any> = {
      last_triggered_at: new Date().toISOString(),
      run_count: (auto.run_count || 0) + 1,
      last_error: skillResult.error || null,
    };
    if (nextRun) updatePayload.next_run_at = nextRun;

    await supabase.from('agent_automations').update(updatePayload).eq('id', automation_id);

    // ── Milestone tracking: auto-update linked objective progress ──
    if (auto.objective_id && !skillResult.error) {
      const { data: objective } = await supabase.from('agent_objectives')
        .select('progress').eq('id', auto.objective_id).maybeSingle();
      if (objective) {
        const progress = (objective.progress as Record<string, any>) || {};
        const key = auto.skill_name || auto.name;
        const milestone = progress[key] || { runs: 0, last_success: null, streak: 0 };
        milestone.runs = (milestone.runs || 0) + 1;
        milestone.last_success = new Date().toISOString();
        milestone.streak = (milestone.streak || 0) + 1;
        progress[key] = milestone;
        progress.total_runs = (progress.total_runs || 0) + 1;
        progress.last_updated = new Date().toISOString();
        await supabase.from('agent_objectives').update({ progress }).eq('id', auto.objective_id);
        console.log(`[heartbeat] Milestone tracked: ${key} run #${milestone.runs} for objective ${auto.objective_id.slice(0, 8)}`);
      }
    }
    // Reset streak on failure
    if (auto.objective_id && skillResult.error) {
      const { data: objective } = await supabase.from('agent_objectives')
        .select('progress').eq('id', auto.objective_id).maybeSingle();
      if (objective) {
        const progress = (objective.progress as Record<string, any>) || {};
        const key = auto.skill_name || auto.name;
        if (progress[key]) {
          progress[key].streak = 0;
          progress[key].last_failure = new Date().toISOString();
          await supabase.from('agent_objectives').update({ progress }).eq('id', auto.objective_id);
        }
      }
    }

    return {
      status: skillResult.error ? 'failed' : 'success',
      automation: auto.name,
      skill: auto.skill_name,
      next_run_at: nextRun,
      result: skillResult,
    };
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
    // 1. Gather context + run self-healing in parallel
    const [agentMemory, objectiveCtx, activityCtx, statsCtx, automationCtx, signalCtx, healingReport] = await Promise.all([
      loadAgentMemory(),
      loadObjectives(supabase),
      loadRecentActivity(supabase),
      loadSiteStats(supabase),
      loadLinkedAutomations(supabase),
      loadPendingSignals(supabase),
      runSelfHealing(supabase),
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
      { type: 'function', function: { name: 'execute_automation', description: 'Execute an enabled automation by ID. Runs its linked skill with preconfigured arguments and updates run metadata. Prioritize objective-linked and DUE (⏰) automations. Skills requiring approval will be logged for review instead of executed.', parameters: { type: 'object', properties: { automation_id: { type: 'string', description: 'The automation UUID to execute' } }, required: ['automation_id'] } } },
      { type: 'function', function: { name: 'signal_acknowledge', description: 'Mark a pending signal task as processed after taking action.', parameters: { type: 'object', properties: { task_id: { type: 'string', description: 'The signal task UUID' }, output: { type: 'object', description: 'Optional result data' } }, required: ['task_id'] } } },
      { type: 'function', function: { name: 'memory_write', description: 'Save to persistent memory.', parameters: { type: 'object', properties: { key: { type: 'string' }, value: { description: 'Info to remember' }, category: { type: 'string', enum: ['preference', 'context', 'fact'] } }, required: ['key', 'value'] } } },
      { type: 'function', function: { name: 'objective_update_progress', description: 'Update progress on an objective.', parameters: { type: 'object', properties: { objective_id: { type: 'string' }, progress: { type: 'object' } }, required: ['objective_id', 'progress'] } } },
      { type: 'function', function: { name: 'objective_complete', description: 'Mark objective as completed.', parameters: { type: 'object', properties: { objective_id: { type: 'string' } }, required: ['objective_id'] } } },
      { type: 'function', function: { name: 'reflect', description: 'Analyze performance over past 7 days.', parameters: { type: 'object', properties: { focus: { type: 'string', enum: ['errors', 'usage', 'automations', 'objectives'] } } } } },
    ];

    const allTools = [...builtInTools, ...skillTools];

    const memoryPrompt = agentMemory.length ? formatMemoryForPrompt(agentMemory) : '';

    const systemPrompt = `You are Magnet running in AUTONOMOUS HEARTBEAT mode. No human is watching.

Your mission: Review system state, process signals, advance objectives, take needed actions, and self-heal.
${memoryPrompt}
${signalCtx}
${objectiveCtx}
${automationCtx}
${activityCtx}
${statsCtx}
${healingReport}

HEARTBEAT PROTOCOL:
1. SIGNALS — Process any pending signals FIRST (new messages, subscribers, published posts). Use appropriate skills to respond, then acknowledge with signal_acknowledge.
2. REFLECT — Analyze past 7 days.
3. OBJECTIVES — Review each active objective. Update progress. Mark complete if criteria met.
4. AUTOMATIONS — Check objective-linked automations (marked ⭐). Execute DUE (⏰) ones first. The system auto-calculates next_run_at after each execution.
5. ACT — If an objective still needs action beyond automations, use available skills.
6. REMEMBER — Save any learnings to memory.
7. SUMMARIZE — Brief heartbeat report.

CONSTRAINTS:
- Max ${MAX_ITERATIONS} tool iterations
- Do NOT send newsletters without approval
- Skills marked requires_approval will be BLOCKED and logged for admin review
- PRIORITIZE: signals > objective-linked DUE automations > other automations
- Self-healing auto-disables skills with ${SELF_HEAL_THRESHOLD}+ consecutive failures
- Be efficient: only act when progress is needed`;

    // 4. Run agentic loop
    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Heartbeat triggered at ${new Date().toISOString()}. Process signals, review objectives, and advance system health.` },
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
