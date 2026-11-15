// ============================================
// Autopilot guardrails
//
// Autopilot proposes; operators decide. A proposal nobody reviews is noise,
// so the queue is capped and old proposals expire:
//  - max_waiting_reviews (default 5): no new drafts while this many wait.
//  - draft_expiry_days (default 14): older drafts are archived, not deleted —
//    blog posts get status 'archived', newsletter drafts are copied into the
//    task log before the unsent campaign is removed.
// Both values can be changed in the autopilot module (settings_update via MCP).
// ============================================

// deno-lint-ignore no-explicit-any
type Supabase = any;

export interface Guardrails {
  maxWaiting: number;
  expiryDays: number;
}

export async function loadGuardrails(supabase: Supabase): Promise<Guardrails> {
  const { data } = await supabase.from("modules").select("module_config").eq("module_type", "autopilot").maybeSingle();
  const c = (data?.module_config || {}) as Record<string, unknown>;
  const num = (v: unknown, d: number, min: number, max: number) =>
    typeof v === "number" && Number.isFinite(v) ? Math.max(min, Math.min(max, Math.floor(v))) : d;
  return {
    maxWaiting: num(c.max_waiting_reviews, 5, 1, 50),
    expiryDays: num(c.draft_expiry_days, 14, 1, 90),
  };
}

/** Archive review items older than the expiry window. Returns how many expired. */
export async function expireOldReviews(supabase: Supabase, g: Guardrails): Promise<number> {
  const cutoff = new Date(Date.now() - g.expiryDays * 86400_000).toISOString();
  const { data: old } = await supabase
    .from("agent_tasks")
    .select("id, task_type, output_data")
    .eq("status", "needs_review")
    .lt("created_at", cutoff);
  if (!old?.length) return 0;

  for (const t of old) {
    const out = (t.output_data || {}) as Record<string, unknown>;
    let extra: Record<string, unknown> = {};
    if (t.task_type === "blog_draft" && out.blog_post_id) {
      await supabase.from("blog_posts").update({ status: "archived" }).eq("id", out.blog_post_id).eq("status", "draft");
    }
    if (t.task_type === "newsletter_draft" && out.campaign_id) {
      const { data: c } = await supabase.from("newsletter_campaigns").select("*").eq("id", out.campaign_id).eq("status", "draft").maybeSingle();
      if (c) {
        extra = { archived_campaign: c };
        await supabase.from("newsletter_campaigns").delete().eq("id", c.id);
      }
    }
    await supabase.from("agent_tasks").update({
      status: "rejected",
      completed_at: new Date().toISOString(),
      output_data: { ...out, ...extra, decision: "expired", decision_note: `Not reviewed within ${g.expiryDays} days` },
    }).eq("id", t.id);
  }
  console.log(`[Autopilot] Expired ${old.length} unreviewed item(s)`);
  return old.length;
}

/** True when the review queue is full and no new draft should be made. */
export async function queueIsFull(supabase: Supabase, g: Guardrails): Promise<{ full: boolean; waiting: number }> {
  const { count } = await supabase.from("agent_tasks").select("id", { count: "exact", head: true }).eq("status", "needs_review");
  const waiting = count || 0;
  return { full: waiting >= g.maxWaiting, waiting };
}

/** Actions that put something in the review queue. */
export const DRAFTING_ACTIONS = new Set(["blog_draft", "newsletter_draft", "multichannel_draft"]);
