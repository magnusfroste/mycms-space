import { describe, expect, it } from "vitest";
import { normalizeProgress, mergeProgress, compactStepResult, summarizeProgress } from "../objective-progress";

describe("normalizeProgress", () => {
  it("parses a JSON string instead of spreading its characters", () => {
    expect(normalizeProgress('{"a":1}')).toEqual({ a: 1 });
    expect({ ...normalizeProgress('"x"') }).toEqual({});
  });
  it("drops per-character keys left by an earlier spread", () => {
    expect(normalizeProgress({ 0: "{", 1: '"', plan: { steps: [] }, last_skill: "x" })).toEqual({ plan: { steps: [] }, last_skill: "x" });
  });
  it("returns {} for null, arrays and bad strings", () => {
    expect(normalizeProgress(null)).toEqual({});
    expect(normalizeProgress([1])).toEqual({});
    expect(normalizeProgress("{oops")).toEqual({});
  });
});

describe("mergeProgress", () => {
  it("merges into the stored progress and keeps the plan", () => {
    const plan = { steps: [{ id: "s1", status: "done" }] };
    const m = mergeProgress({ plan, total_runs: 2 }, '{"note":"ok","plan":null}');
    expect(m.plan).toBe(plan);
    expect(m).toMatchObject({ total_runs: 2, note: "ok" });
  });
});

describe("compactStepResult", () => {
  it("keeps status, task id and errors, not the full answer", () => {
    const r = compactStepResult({ status: "pending_review", task_id: "t1", result: { status: "pending_review", task_id: "t1", body: "x".repeat(5000) } });
    expect(r).toEqual({ status: "pending_review", task_id: "t1", result: { status: "pending_review", task_id: "t1" } });
  });
  it("summarises answers without known fields", () => {
    expect(compactStepResult({ visitors: 3 })).toEqual({ summary: '{"visitors":3}' });
  });
});

describe("summarizeProgress", () => {
  it("lists steps on one line and stays short", () => {
    const s = summarizeProgress({ plan: { steps: [{ id: "s1", status: "done", description: "Research", skill_name: "research_topic", result: { big: "x".repeat(9000) } }] }, total_runs: 3 });
    expect(s).toBe("s1 [done] Research (research_topic) | total_runs=3");
    expect(summarizeProgress({ plan: { steps: Array.from({ length: 200 }, (_, i) => ({ id: `s${i}`, description: "d".repeat(100) })) } }).length).toBeLessThanOrEqual(1501);
  });
});
