// Pure rules for objective plan steps (no Deno imports; unit-tested).

export type StepStatus = "pending" | "running" | "done" | "skipped" | "failed" | "awaiting_approval" | "manual";

/** Statuses that count as finished for an objective. */
export const FINISHED: ReadonlySet<string> = new Set(["done", "skipped"]);

/**
 * Status of a step from the agent-execute answer. A skill waiting for review
 * or approval has produced nothing yet, and a step with no skill needs a
 * person, so neither is done.
 */
export function stepStatus(result: any, hasSkill: boolean): StepStatus {
  if (!hasSkill) return "manual";
  const status = result?.status;
  const inner = result?.result?.status;
  if (status === "pending_approval" || status === "pending_review" || inner === "pending_review") return "awaiting_approval";
  if (status === "skipped" || inner === "skipped") return "skipped";
  if (!result || result.error || status === "failed") return "failed";
  return "done";
}

export function planComplete(steps: Array<{ status: string }>): boolean {
  return steps.length > 0 && steps.every((s) => FINISHED.has(s.status));
}

export function openSteps<T extends { status: string }>(steps: T[]): T[] {
  return steps.filter((s) => !FINISHED.has(s.status) && s.status !== "pending");
}

/** The review/draft task a waiting step is linked to, from the agent-execute answer it stored. */
export function waitingTaskId(result: any): string | null {
  const id = result?.task_id ?? result?.result?.task_id;
  return typeof id === "string" && id ? id : null;
}

/**
 * New status for a waiting step from its task's status, or null while it
 * still waits (running, or in the review queue).
 */
export function resolvedStepStatus(taskStatus: string | null | undefined): StepStatus | null {
  switch (taskStatus) {
    case "completed":
    case "approved":
    case "published":
      return "done";
    case "rejected":
    case "expired":
      return "skipped";
    case "failed":
      return "failed";
    default:
      return null;
  }
}
