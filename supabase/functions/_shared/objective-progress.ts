// Objective progress: one shape for every writer, and a short form for prompts.
// Pure TypeScript (no Deno imports): unit-tested with vitest.
//
// progress is a JSON object on agent_objectives. Models sometimes send it as a
// JSON string; spreading a string makes one key per character, which is how an
// objective once grew to 5,000+ keys and ~25k tokens per heartbeat call.

export type Progress = Record<string, any>;

const CHAR_KEY = /^\d+$/;

/** Always a plain object: parses a JSON string, drops per-character keys, else {}. */
export function normalizeProgress(value: unknown): Progress {
  let v = value;
  if (typeof v === "string") {
    try { v = JSON.parse(v); } catch { return {}; }
  }
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  const out: Progress = {};
  for (const [k, val] of Object.entries(v as Progress)) if (!CHAR_KEY.test(k)) out[k] = val;
  return out;
}

/** Merge a model's progress update into the stored one. The plan is owned by the planning tools. */
export function mergeProgress(existing: unknown, update: unknown): Progress {
  const base = normalizeProgress(existing);
  const { plan: _ignored, ...rest } = normalizeProgress(update);
  return { ...base, ...rest, last_updated: new Date().toISOString() };
}

const clip = (s: unknown, n: number) => {
  const t = typeof s === "string" ? s : s == null ? "" : JSON.stringify(s);
  return t.length > n ? `${t.slice(0, n)}…` : t;
};

/**
 * What a plan step keeps of a skill's answer: enough for stepStatus and
 * waitingTaskId, plus a short summary. The full answer goes to the model once.
 */
export function compactStepResult(result: any): Progress | null {
  if (result == null || typeof result !== "object") return result ?? null;
  const out: Progress = {};
  if (result.status) out.status = result.status;
  if (result.task_id) out.task_id = result.task_id;
  if (result.error) out.error = clip(result.error, 300);
  if (result.message) out.message = clip(result.message, 300);
  const inner = result.result;
  if (inner && typeof inner === "object") {
    const r: Progress = {};
    if (inner.status) r.status = inner.status;
    if (inner.task_id) r.task_id = inner.task_id;
    if (inner.title) r.title = clip(inner.title, 160);
    if (Object.keys(r).length) out.result = r;
  }
  if (!Object.keys(out).length) out.summary = clip(result, 300);
  return out;
}

/** Progress for a prompt: the plan as one line per step, plus a few counters. */
export function summarizeProgress(value: unknown, maxChars = 1500): string {
  const p = normalizeProgress(value);
  const parts: string[] = [];
  const steps: any[] = Array.isArray(p.plan?.steps) ? p.plan.steps : [];
  if (steps.length) {
    parts.push(steps.map((s) =>
      `${s.id || "?"} [${s.status || "pending"}] ${clip(s.description, 120)}${s.skill_name ? ` (${s.skill_name})` : ""}`).join("; "));
  }
  for (const k of ["total_runs", "total_actions", "last_skill", "last_updated", "proposed_by", "reason"]) {
    if (p[k] != null) parts.push(`${k}=${clip(p[k], 160)}`);
  }
  const s = parts.join(" | ");
  return s.length > maxChars ? `${s.slice(0, maxChars)}…` : s || "none";
}
