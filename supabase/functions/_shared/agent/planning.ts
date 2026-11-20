// ============================================
// Planning tools — objectives, plans, automations and signals.
// Used by every admin-side agent surface (Magnet in the admin and the
// heartbeat) through the shared toolbox. Moved from magnet-heartbeat.
// ============================================

import { operatorSkills } from "../skills.ts";
import { stepStatus, planComplete, openSteps, waitingTaskId, resolvedStepStatus, planStepsFromModel } from "../plan-steps.ts";
import { parseModelJson } from "../model-json.ts";
import { normalizeProgress, compactStepResult } from "../objective-progress.ts";
import type { ToolDefinition } from "./reason.ts";

const MAX_CHAIN_DEPTH = 4; // max steps to chain in a single advance_plan call

export const PLANNING_TOOLS: ToolDefinition[] = [
  { type: 'function', function: { name: 'decompose_objective', description: 'Break an objective into 3-7 ordered steps using AI planning. Each step maps to an available skill. Use this when an objective has no plan yet.', parameters: { type: 'object', properties: { objective_id: { type: 'string', description: 'The objective UUID to decompose' } }, required: ['objective_id'] } } },
  { type: 'function', function: { name: 'advance_plan', description: 'Execute the next pending step(s) in an objective\'s plan with automatic chaining. By default (chain=true), up to 4 consecutive steps are executed in one call — stopping on failure, manual steps, or completion. Set chain=false to execute only one step. This is the PRIMARY tool for plan execution — prefer it over calling advance_plan multiple times.', parameters: { type: 'object', properties: { objective_id: { type: 'string', description: 'The objective UUID whose plan to advance' }, chain: { type: 'boolean', description: 'Auto-chain consecutive steps (default: true). Set false to execute only one step.' } }, required: ['objective_id'] } } },
  { type: 'function', function: { name: 'execute_automation', description: 'Execute an enabled automation by ID. Runs its linked skill with preconfigured arguments and updates run metadata. Prioritize objective-linked and DUE (⏰) automations. Skills requiring approval land in the review queue instead of running.', parameters: { type: 'object', properties: { automation_id: { type: 'string', description: 'The automation UUID to execute' } }, required: ['automation_id'] } } },
  { type: 'function', function: { name: 'signal_acknowledge', description: 'Mark a pending signal task as processed after taking action.', parameters: { type: 'object', properties: { task_id: { type: 'string', description: 'The signal task UUID' }, output: { type: 'object', description: 'Optional result data' } }, required: ['task_id'] } } },
  { type: 'function', function: { name: 'propose_objective', description: 'Proactively create a new objective based on signal patterns, site stats, or strategic gaps. Only propose when there is a clear need not covered by existing objectives. Avoids duplicates automatically.', parameters: { type: 'object', properties: { goal: { type: 'string', description: 'The objective goal' }, reason: { type: 'string', description: 'Why this objective is being proposed (e.g. signal pattern, stat trend)' }, constraints: { type: 'object', description: 'Optional constraints' }, success_criteria: { type: 'object', description: 'How to measure success' } }, required: ['goal', 'reason'] } } },
] as ToolDefinition[];

export const PLANNING_TOOL_NAMES = new Set(PLANNING_TOOLS.map((t) => t.function.name));

export function calculateNextRun(cronExpr: string): string | null {
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

function parsePlan(raw: string | null | undefined, known: ReadonlySet<string>) {
  try { return planStepsFromModel(parseModelJson(raw || ''), known); } catch { return []; }
}

async function decomposeObjectiveIntoPlan(
  objective: { id: string; goal: string; constraints: any; success_criteria: any },
  supabase: any,
): Promise<{ steps: any[]; total_steps: number }> {
  // Load available skills to inform step generation
  const { data: skillRows } = await supabase.from('agent_skills')
    .select('id, name, description, handler, scope, category, enabled, requires_approval, tool_definition');
  const skills = operatorSkills(skillRows || []);

  const skillList = skills.map((s) => `- ${s.name}: ${s.description}${s.requires_approval ? ' (needs admin approval)' : ''}`).join('\n');

  // Dynamic imports: ai-agent imports this module, so static imports would cycle.
  const { callOpenAICompatible } = await import("../ai-agent.ts");
  const { resolveConfiguredDefaultAI } = await import("../ai-provider.ts");
  const { url, apiKey, model } = await resolveConfiguredDefaultAI();
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

  const known = new Set(skills.map((s) => s.name));
  let steps = parsePlan(data.choices?.[0]?.message?.content, known);
  if (!steps.length) {
    // One retry with a reminder; models sometimes wrap or break the JSON.
    const again = await callOpenAICompatible({
      url, apiKey, model,
      messages: [
        { role: 'system', content: 'Return ONLY a JSON array of 3-7 plan steps as described. No prose, no markdown.' },
        { role: 'user', content: `Objective: "${objective.goal}"\nSkills: ${[...known].join(', ')}\nStep shape: {"description":"...","skill_name":"name or null","skill_args":{}}` },
      ],
    });
    steps = parsePlan(again.choices?.[0]?.message?.content, known);
  }
  if (!steps.length) {
    steps = [{ id: 's1', order: 1, description: objective.goal, skill_name: null, skill_args: {}, status: 'pending' }];
  }

  return { steps, total_steps: steps.length };
}

export async function executePlanningTool(supabase: any, supabaseUrl: string, serviceKey: string, fnName: string, args: any): Promise<any> {
  // Decompose objective into multi-step plan
  if (fnName === 'decompose_objective') {
    const { objective_id } = args;
    const { data: obj, error } = await supabase.from('agent_objectives')
      .select('id, goal, constraints, success_criteria, progress')
      .eq('id', objective_id).single();
    if (error || !obj) return { status: 'error', error: error?.message || 'Objective not found' };

    const plan = await decomposeObjectiveIntoPlan(obj, supabase);
    const progress = normalizeProgress(obj.progress);
    progress.plan = { ...plan, current_step: 0, created_at: new Date().toISOString() };

    await supabase.from('agent_objectives').update({ progress }).eq('id', objective_id);
    return { status: 'planned', objective_id, steps: plan.steps.length, plan: plan.steps };
  }

  // Advance plan: execute next pending step(s) with optional chaining
  if (fnName === 'advance_plan') {
    const { objective_id, chain = true } = args;
    const maxSteps = chain ? MAX_CHAIN_DEPTH : 1;
    const chainResults: any[] = [];

    for (let depth = 0; depth < maxSteps; depth++) {
      // Re-read objective each iteration to get latest state
      const { data: obj, error } = await supabase.from('agent_objectives')
        .select('id, goal, progress')
        .eq('id', objective_id).single();
      if (error || !obj) return { status: 'error', error: error?.message || 'Objective not found' };

      const progress = normalizeProgress(obj.progress);
      const plan = progress.plan;
      if (!plan?.steps?.length) return { status: 'no_plan', message: 'No plan found. Use decompose_objective first.', chain_results: chainResults };

      // Steps that waited on a draft or an approval follow their task's real outcome.
      const waiting = plan.steps.filter((s: any) => s.status === 'awaiting_approval' && waitingTaskId(s.result));
      if (waiting.length) {
        const ids = waiting.map((s: any) => waitingTaskId(s.result));
        const { data: tasks } = await supabase.from('agent_tasks').select('id, status').in('id', ids);
        let changed = false;
        for (const s of waiting) {
          const next = resolvedStepStatus(tasks?.find((t: any) => t.id === waitingTaskId(s.result))?.status);
          if (next) { s.status = next; s.resolved_at = new Date().toISOString(); changed = true; }
        }
        if (changed) {
          plan.completed = planComplete(plan.steps);
          plan.has_failures = plan.steps.some((s: any) => s.status === 'failed');
          await supabase.from('agent_objectives').update({ progress }).eq('id', objective_id);
        }
      }

      // Find next pending step
      const nextStep = plan.steps.find((s: any) => s.status === 'pending');
      if (!nextStep) {
        // Steps waiting on admin approval or a manual action are not done.
        const open = openSteps(plan.steps);
        if (open.length) {
          return {
            status: 'waiting', message: `${open.length} step(s) wait for admin approval or a manual action.`,
            waiting_steps: open.map((s: any) => ({ step: s.description, skill: s.skill_name, status: s.status })),
            chain_results: chainResults,
          };
        }
        // All done — mark objective completed if not already
        if (!plan.completed) {
          plan.completed = true;
          progress.plan = plan;
          progress.last_updated = new Date().toISOString();
          await supabase.from('agent_objectives').update({ progress }).eq('id', objective_id);
        }
        return { status: 'all_done', message: 'All plan steps completed.', chain_results: chainResults };
      }

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

      // Update step status. A skill that waits for approval, or a step with no
      // skill, has not produced anything yet, so it is not done.
      nextStep.status = stepStatus(result, !!nextStep.skill_name);
      const success = nextStep.status === 'done' || nextStep.status === 'skipped';
      nextStep.result = compactStepResult(result);
      nextStep.completed_at = new Date().toISOString();

      // Check if all steps are done
      const allDone = planComplete(plan.steps);
      const anyFailed = plan.steps.some((s: any) => s.status === 'failed');
      plan.completed = allDone;
      plan.has_failures = anyFailed;

      // Update progress
      progress.plan = plan;
      progress.total_runs = (progress.total_runs || 0) + 1;
      progress.last_updated = new Date().toISOString();
      await supabase.from('agent_objectives').update({ progress }).eq('id', objective_id);

      const remaining = plan.steps.filter((s: any) => s.status === 'pending').length;
      const stepResult = {
        step: nextStep.description,
        skill: nextStep.skill_name,
        status: nextStep.status,
        remaining_steps: remaining,
      };
      chainResults.push(stepResult);

      console.log(`[planning] Chain step ${depth + 1}: ${nextStep.skill_name || 'manual'} → ${nextStep.status} (${remaining} remaining)`);

      // Stop chaining on failure, manual steps, or completion
      if (!success || !nextStep.skill_name || allDone) break;
    }

    const lastResult = chainResults[chainResults.length - 1];
    return {
      status: chainResults.some(r => r.status === 'failed') ? 'chain_partial' : 'chain_completed',
      steps_executed: chainResults.length,
      remaining_steps: lastResult?.remaining_steps ?? 0,
      plan_completed: chainResults.length > 0 && lastResult?.remaining_steps === 0,
      chain_results: chainResults,
    };
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

  // Propose a new objective based on proactive analysis
  if (fnName === 'propose_objective') {
    const { goal, constraints, success_criteria, reason } = args;
    // Check for duplicate active objectives with similar goals
    const { data: existing } = await supabase.from('agent_objectives')
      .select('id, goal').eq('status', 'active');
    const isDuplicate = (existing || []).some((o: any) =>
      o.goal.toLowerCase().includes(goal.toLowerCase().slice(0, 20)) ||
      goal.toLowerCase().includes(o.goal.toLowerCase().slice(0, 20))
    );
    if (isDuplicate) {
      return { status: 'skipped', reason: 'Similar objective already active' };
    }

    const { data: newObj, error } = await supabase.from('agent_objectives')
      .insert({
        goal,
        constraints: constraints || {},
        success_criteria: success_criteria || {},
        progress: { proposed_by: 'magnet', reason: reason || 'proactive', proposed_at: new Date().toISOString() },
        status: 'active',
      })
      .select('id').single();
    if (error) return { status: 'error', error: error.message };

    // Log the proposal
    await supabase.from('agent_activity').insert({
      agent: 'magnet', skill_name: 'propose_objective',
      input: { goal, reason },
      output: { objective_id: newObj.id },
      status: 'success',
    });

    return { status: 'proposed', objective_id: newObj.id, goal };
  }

  // Execute automation with next_run_at calculation
  if (fnName === 'execute_automation') {
    const { automation_id } = args;
    const { data: auto, error: fetchErr } = await supabase.from('agent_automations')
      .select('*').eq('id', automation_id).maybeSingle();
    if (fetchErr || !auto) return { status: 'error', error: fetchErr?.message || 'Automation not found' };

    // Approval is handled by agent-execute: a skill that needs it lands in the review queue.
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
        const progress = normalizeProgress(objective.progress);
        const key = auto.skill_name || auto.name;
        const milestone = progress[key] || { runs: 0, last_success: null, streak: 0 };
        milestone.runs = (milestone.runs || 0) + 1;
        milestone.last_success = new Date().toISOString();
        milestone.streak = (milestone.streak || 0) + 1;
        progress[key] = milestone;
        progress.total_runs = (progress.total_runs || 0) + 1;
        progress.last_updated = new Date().toISOString();
        await supabase.from('agent_objectives').update({ progress }).eq('id', auto.objective_id);
        console.log(`[planning] Milestone tracked: ${key} run #${milestone.runs} for objective ${auto.objective_id.slice(0, 8)}`);
      }
    }
    // Reset streak on failure
    if (auto.objective_id && skillResult.error) {
      const { data: objective } = await supabase.from('agent_objectives')
        .select('progress').eq('id', auto.objective_id).maybeSingle();
      if (objective) {
        const progress = normalizeProgress(objective.progress);
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

  return { status: 'error', error: `Unknown planning tool: ${fnName}` };
}
