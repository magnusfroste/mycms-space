import { describe, expect, it } from "vitest";
import { openSteps, planComplete, stepStatus } from "../plan-steps";

describe("stepStatus", () => {
  it.each([
    ["success", { status: "success", result: { ok: 1 } }, true, "done"],
    ["waits for approval (old gate)", { status: "pending_approval" }, true, "awaiting_approval"],
    ["waits in review queue", { status: "pending_review", task_id: "t" }, true, "awaiting_approval"],
    ["skipped", { status: "skipped", result: { status: "skipped" } }, true, "skipped"],
    ["error", { error: "boom" }, true, "failed"],
    ["failed", { status: "failed", result: { error: "x" } }, true, "failed"],
    ["no answer", null, true, "failed"],
    ["no skill", { status: "manual" }, false, "manual"],
  ])("%s → %s", (_, result, hasSkill, expected) => expect(stepStatus(result, hasSkill as boolean)).toBe(expected));
});

describe("planComplete", () => {
  it("is complete only when every step is done or skipped", () => {
    expect(planComplete([{ status: "done" }, { status: "skipped" }])).toBe(true);
    expect(planComplete([{ status: "done" }, { status: "awaiting_approval" }])).toBe(false);
    expect(planComplete([{ status: "done" }, { status: "manual" }])).toBe(false);
    expect(planComplete([])).toBe(false);
  });

  it("lists the steps that wait on a person", () => {
    const open = openSteps([{ status: "done" }, { status: "awaiting_approval" }, { status: "manual" }, { status: "pending" }]);
    expect(open.map((s) => s.status)).toEqual(["awaiting_approval", "manual"]);
  });
});

import { resolvedStepStatus, waitingTaskId } from "../plan-steps";

describe("waiting steps follow their task", () => {
  it("finds the task id in a skill_call or a background draft answer", () => {
    expect(waitingTaskId({ status: "pending_review", task_id: "t1" })).toBe("t1");
    expect(waitingTaskId({ status: "success", result: { status: "pending_review", task_id: "t2" } })).toBe("t2");
    expect(waitingTaskId({ status: "pending_approval" })).toBeNull();
  });

  it.each([
    ["completed", "done"], ["approved", "done"], ["published", "done"],
    ["rejected", "skipped"], ["expired", "skipped"], ["failed", "failed"],
    ["running", null], ["needs_review", null], [undefined, null],
  ])("task %s → step %s", (task, step) => expect(resolvedStepStatus(task as string | undefined)).toBe(step));
});
