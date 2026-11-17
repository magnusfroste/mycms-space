// ============================================
// Magnet Heartbeat — the autonomous surface of the one agent
// Scheduled: signals → objectives → automations → act → heal → remember.
// Context and prompt live here; the reasoning loop, tools and guards are the
// shared core (_shared/agent/reason.ts, buildToolbox('heartbeat')).
// ============================================

import { createClient } from "npm:@supabase/supabase-js@2";
import { loadAgentMemory, formatMemoryForPrompt } from "../_shared/ai-context.ts";
import { resolveDefaultAI, resolveProvider, callOpenAICompatible, buildToolbox } from "../_shared/ai-agent.ts";
import { reason } from "../_shared/agent/reason.ts";
import { failStaleRuns } from "../_shared/guardrails.ts";
import { isTrustedCaller, forbidden } from "../_shared/cron-auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MAX_ITERATIONS = 12;
const TOKEN_BUDGET = 120_000;
const WALL_CLOCK_MS = 100_000; // no new tool round after this; the run must end well inside the edge time limit
const LOCK_TTL_SECONDS = 600;
const SELF_HEAL_THRESHOLD = 3; // consecutive failures before auto-disable

// ─── Context loaders ──────────────────────────────────────────────────────────

async function loadObjectives(supabase: any): Promise<string> {
  const { data } = await supabase
    .from('agent_objectives')
    .select('id, goal, status, constraints, success_criteria, progress, created_at, updated_at')
    .eq('status', 'active')
    .order('created_at', { ascending: false }).limit(10);
  if (!data?.length) return '\nNo active objectives.';

  // Score each objective for priority ranking
  const scored = data.map((o: any) => {
    let score = 0;
    const plan = o.progress?.plan;
    const constraints = o.constraints || {};
    const now = Date.now();

    // Urgency: deadline proximity
    if (constraints.deadline) {
      const daysLeft = (new Date(constraints.deadline).getTime() - now) / 86_400_000;
      if (daysLeft < 0) score += 50; // overdue
      else if (daysLeft < 1) score += 40;
      else if (daysLeft < 3) score += 25;
      else if (daysLeft < 7) score += 10;
    }

    // Urgency: priority field
    if (constraints.priority === 'critical') score += 35;
    else if (constraints.priority === 'high') score += 20;
    else if (constraints.priority === 'medium') score += 10;

    // Impact: has plan and partially done (momentum)
    if (plan?.steps?.length) {
      const done = plan.steps.filter((s: any) => s.status === 'done').length;
      const pct = done / plan.steps.length;
      if (pct > 0 && pct < 1) score += 15; // in-progress momentum bonus
      if (pct >= 0.7) score += 10; // near completion bonus
    } else {
      score += 5; // needs plan — slight boost to get started
    }

    // Staleness: hasn't been updated recently
    const daysSinceUpdate = (now - new Date(o.updated_at).getTime()) / 86_400_000;
    if (daysSinceUpdate > 3) score += 8;
    if (daysSinceUpdate > 7) score += 12;

    // Has failures — needs attention
    if (plan?.has_failures) score += 10;

    return { ...o, _priority_score: score };
  });

  // Sort by priority score descending
  scored.sort((a: any, b: any) => b._priority_score - a._priority_score);

  return '\n\nActive objectives (sorted by priority ⬆️):\n' + scored.map((o: any, i: number) => {
    const plan = o.progress?.plan;
    const planInfo = plan
      ? ` | plan: ${plan.steps?.filter((s: any) => s.status === 'done').length}/${plan.total_steps} steps done`
      : ' | NO PLAN (needs decompose_objective)';
    const deadline = o.constraints?.deadline ? ` | ⏰ deadline: ${o.constraints.deadline}` : '';
    const priority = o.constraints?.priority ? ` | priority: ${o.constraints.priority}` : '';
    return `- #${i + 1} [score:${o._priority_score}] [${o.id}] "${o.goal}"${planInfo}${deadline}${priority} | progress: ${JSON.stringify(o.progress)} | criteria: ${JSON.stringify(o.success_criteria)}`;
  }).join('\n');
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
    out += `\n- ⭐${due} [${a.id}] "${a.name}" → skill: ${a.skill_name} | objective: ${a.objective_id} | runs: ${a.run_count} | last_error: ${a.last_error || 'none'}`;
  }
  for (const a of unlinked) {
    const due = a.next_run_at && new Date(a.next_run_at) <= now ? ' ⏰ DUE' : '';
    out += `\n-${due} [${a.id}] "${a.name}" → skill: ${a.skill_name} | runs: ${a.run_count}`;
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
    `- [${t.id}] ${t.input_data?.title || t.input_data?.event || 'Unknown'} (${t.created_at})`
  ).join('\n');
}

async function loadRecentSignalPatterns(supabase: any): Promise<string> {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const { data } = await supabase
    .from('agent_tasks')
    .select('input_data, status, created_at')
    .eq('task_type', 'signal')
    .gte('created_at', weekAgo.toISOString())
    .order('created_at', { ascending: false }).limit(30);
  if (!data?.length) return '\nNo recent signals for pattern analysis.';

  // Summarize patterns by event type and source
  const byEvent: Record<string, number> = {};
  const bySource: Record<string, number> = {};
  for (const t of data) {
    const event = t.input_data?.event || t.input_data?.source_type || 'unknown';
    const source = t.input_data?.source_type || 'unknown';
    byEvent[event] = (byEvent[event] || 0) + 1;
    bySource[source] = (bySource[source] || 0) + 1;
  }

  return `\n\n📊 Signal patterns (7 days, ${data.length} signals):\n` +
    `Events: ${Object.entries(byEvent).map(([k, v]) => `${k}(${v})`).join(', ')}\n` +
    `Sources: ${Object.entries(bySource).map(([k, v]) => `${k}(${v})`).join(', ')}\n` +
    `Recent topics: ${data.slice(0, 5).map((t: any) => t.input_data?.title || '').filter(Boolean).join('; ')}`;
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

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (!(await isTrustedCaller(req))) return forbidden(corsHeaders);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);
  const startTime = Date.now();

  // One heartbeat at a time; the lock expires by itself after LOCK_TTL_SECONDS.
  const holder = crypto.randomUUID();
  const { data: locked, error: lockError } = await supabase.rpc('try_acquire_agent_lock', { p_lane: 'heartbeat', p_holder: holder, p_ttl_seconds: LOCK_TTL_SECONDS });
  if (lockError) console.warn('[heartbeat] Lock unavailable, running without it:', lockError.message);
  else if (locked !== true) {
    return new Response(JSON.stringify({ status: 'skipped', reason: 'another heartbeat is running' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // 0. Runs that died without finishing are failed, so plans can move on.
    await failStaleRuns(supabase);

    // 1. Gather context + run self-healing in parallel
    const [agentMemory, objectiveCtx, activityCtx, statsCtx, automationCtx, signalCtx, signalPatternCtx, healingReport] = await Promise.all([
      loadAgentMemory(),
      loadObjectives(supabase),
      loadRecentActivity(supabase),
      loadSiteStats(supabase),
      loadLinkedAutomations(supabase),
      loadPendingSignals(supabase),
      loadRecentSignalPatterns(supabase),
      runSelfHealing(supabase),
    ]);

    // 2. Resolve AI provider
    const { data: aiModule } = await supabase.from('modules')
      .select('module_config').eq('module_type', 'ai').maybeSingle();
    const aiConfig = (aiModule?.module_config as any) || {};
    const provider = aiConfig.active_integration || 'lovable';
    // integration holds the settings of the active provider (flat object)
    const integ = aiConfig.integration?.type === provider ? aiConfig.integration : {};

    const { url, apiKey, model } = provider === 'n8n'
      ? resolveDefaultAI()
      : resolveProvider({
        provider,
        model: integ.model,
        baseUrl: integ.base_url,
        apiKeyEnv: integ.api_key_env,
      });

    // 3. Tools: the heartbeat surface of the shared toolbox
    const toolbox = await buildToolbox('heartbeat');

    const memoryPrompt = agentMemory.length ? formatMemoryForPrompt(agentMemory) : '';

    const systemPrompt = `You are Magnet running in AUTONOMOUS HEARTBEAT mode. No human is watching.

Your mission: Review system state, process signals, advance objectives via multi-step plans, proactively identify opportunities, and self-heal.
${memoryPrompt}
${signalCtx}
${signalPatternCtx}
${objectiveCtx}
${automationCtx}
${activityCtx}
${statsCtx}
${healingReport}

HEARTBEAT PROTOCOL:
1. SIGNALS — Process any pending signals FIRST. Acknowledge with signal_acknowledge.
2. PROACTIVE REASONING — Analyze signal patterns + site stats. If you spot a trend, gap, or opportunity NOT covered by existing objectives, use propose_objective to create one. Examples:
   - Multiple signals about similar topics → content objective
   - Drop in page views → engagement objective
   - Surge in subscribers → nurture/welcome objective
   - Recurring errors → reliability objective
   Only propose if genuinely valuable. Max 1 new objective per heartbeat.
3. PLAN — For each active objective WITHOUT a plan (no progress.plan), call decompose_objective to create a step-by-step plan.
4. ADVANCE — Objectives are pre-sorted by priority score. Advance them IN ORDER (highest score first). Use advance_plan with chain=true to execute multiple steps per objective.
5. AUTOMATIONS — Check DUE (⏰) automations. Execute them.
6. REFLECT — Analyze if objectives need plan adjustments.
7. REMEMBER — Save learnings with save_memory.
8. SUMMARIZE — Brief heartbeat report including plan progress and any new proposals.

PRIORITY SCORING (automatic, shown as [score:N]):
- Deadline proximity: overdue +50, <1 day +40, <3 days +25, <7 days +10
- Priority field: critical +35, high +20, medium +10
- Momentum: in-progress plans +15, near completion (>70%) +10
- Staleness: no update >3 days +8, >7 days +12
- Failures: plan has failed steps +10
- No plan yet: +5 (to get started)
Advance the HIGHEST scored objectives first. If iteration budget is limited, skip low-priority objectives.

MULTI-STEP PLANNING RULES:
- Each objective should have a plan (3-7 steps). Use decompose_objective to create one.
- advance_plan auto-chains up to 4 steps per call. Use it — don't call advance_plan repeatedly for the same objective.
- If a step fails, note it but continue to the next objective — don't retry in the same heartbeat.
- If ALL steps are done, mark the objective as completed via objective_complete.
- Plans persist between heartbeats. Magnet picks up where it left off.

PROACTIVE REASONING RULES:
- Only propose objectives when signal patterns or stats clearly warrant action
- Never duplicate existing active objectives (the system checks automatically)
- Include a clear "reason" explaining what data drove the proposal
- Keep goals specific and actionable, not vague
- Prefer improving existing objectives over creating new ones when possible
- When proposing, set constraints.priority ('critical'|'high'|'medium'|'low') and optionally constraints.deadline

CONSTRAINTS:
- Max ${MAX_ITERATIONS} tool iterations per heartbeat
- Drafting skills (draft_blog_post, draft_newsletter, draft_all_channels) put their drafts in the review queue; a skill marked requires_approval waits there too. Waiting for a person is not done.
- PRIORITIZE: signals > proactive proposals > high-score objectives > DUE automations
- Self-healing auto-disables skills with ${SELF_HEAL_THRESHOLD}+ consecutive failures
- Be efficient: use chaining, focus on top 2-3 objectives per heartbeat`;

    // 4. Reason with the shared core
    const run = await reason([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Heartbeat triggered at ${new Date().toISOString()}. Process signals, review objectives, and advance system health.` },
    ], {
      surface: 'heartbeat',
      callModel: ({ messages: m, tools }) => callOpenAICompatible({ url, apiKey, model, messages: m as any, tools: tools as any, timeoutMs: 120_000 }),
      tools: toolbox.tools,
      executeTool: toolbox.executeTool,
      maxIterations: MAX_ITERATIONS,
      tokenBudget: TOKEN_BUDGET,
      deadlineAt: startTime + WALL_CLOCK_MS,
      toolTimeoutMs: 45_000,
      onToolCall: ({ name, ok }) => console.log(`[heartbeat] ${name} → ${ok ? 'ok' : 'failed'}`),
    });
    const finalResponse = run.output;
    const actionsExecuted = run.toolCalls.map((t) => t.name);

    const duration = Date.now() - startTime;

    // Log heartbeat
    await supabase.from('agent_activity').insert({
      agent: 'magnet', skill_name: 'heartbeat',
      input: { trigger: 'scheduled', actions: actionsExecuted },
      output: { summary: finalResponse.slice(0, 2000), stop_reason: run.stopReason, iterations: run.iterations, tokens: run.tokensUsed, failed_tools: run.toolCalls.filter((t) => !t.ok).map((t) => t.name) },
      status: 'success', duration_ms: duration,
    });

    console.log(`[heartbeat] Complete in ${duration}ms, ${actionsExecuted.length} actions`);

    return new Response(JSON.stringify({
      status: 'ok', duration_ms: duration, stop_reason: run.stopReason,
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
  } finally {
    await supabase.rpc('release_agent_lock', { p_lane: 'heartbeat', p_holder: holder });
  }
});
