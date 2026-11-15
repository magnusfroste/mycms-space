import { describe, expect, it, vi } from "vitest";
import { reason, type CallModel, type ToolDefinition } from "../agent/reason";

const tool = (name: string): ToolDefinition => ({ type: "function", function: { name, description: name, parameters: { type: "object", properties: {} } } });
const call = (name: string, args: Record<string, unknown> = {}, id = `c_${name}`) => ({ id, type: "function", function: { name, arguments: JSON.stringify(args) } });
const say = (content: string, tokens = 10) => ({ choices: [{ message: { content } }], usage: { total_tokens: tokens } });
const useTools = (calls: ReturnType<typeof call>[], tokens = 10) => ({ choices: [{ message: { content: null, tool_calls: calls } }], usage: { total_tokens: tokens } });

/** A model that plays back a script, then answers "done". */
function scripted(steps: Array<ReturnType<typeof say> | ReturnType<typeof useTools>>): CallModel & { calls: number } {
  const fn = (async () => steps[fn.calls++] ?? say("done")) as CallModel & { calls: number };
  fn.calls = 0;
  return fn;
}

describe("reason", () => {
  it("answers directly when no tool is needed", async () => {
    const r = await reason([{ role: "user", content: "hi" }], {
      surface: "public", callModel: scripted([say("hello")]), tools: [], executeTool: vi.fn(),
    });
    expect(r).toMatchObject({ output: "hello", stopReason: "answered", iterations: 0 });
  });

  it("runs tools, feeds results back and returns the answer and artifacts", async () => {
    const exec = vi.fn(async () => ({ content: '{"score":92}', artifacts: [{ type: "cv-match", title: "Fit", data: {} }] }));
    const r = await reason([{ role: "user", content: "fit?" }], {
      surface: "public", callModel: scripted([useTools([call("analyze")]), say("92/100")]), tools: [tool("analyze")], executeTool: exec,
    });
    expect(exec).toHaveBeenCalledWith("analyze", {}, expect.anything());
    expect(r.output).toBe("92/100");
    expect(r.artifacts?.[0].type).toBe("cv-match");
    expect(r.messages.find((m) => m.role === "tool")?.content).toBe('{"score":92}');
  });

  it("refuses tools that were not offered", async () => {
    const exec = vi.fn();
    const r = await reason([{ role: "user", content: "x" }], {
      surface: "public", callModel: scripted([useTools([call("file_write")])]), tools: [tool("analyze")], executeTool: exec,
    });
    expect(exec).not.toHaveBeenCalled();
    expect(r.toolCalls).toEqual([{ name: "file_write", ok: false }]);
  });

  it("stops calling tools after repeated failures (circuit breaker)", async () => {
    const fail = async () => ({ content: '{"error":"x"}', ok: false });
    const model = scripted([useTools([call("a", { n: 1 })]), useTools([call("a", { n: 2 })]), useTools([call("a", { n: 3 })])]);
    const r = await reason([{ role: "user", content: "x" }], { surface: "heartbeat", callModel: model, tools: [tool("a")], executeTool: fail, maxIterations: 10 });
    expect(r.stopReason).toBe("circuit_breaker");
    expect(r.toolCalls).toHaveLength(3);
    expect(r.output).toBe("done");
  });

  it("blocks the same call with the same arguments after maxRepeats", async () => {
    const exec = vi.fn(async () => ({ content: "ok" }));
    const model = scripted([useTools([call("a")]), useTools([call("a")]), useTools([call("a")]), say("fine")]);
    const r = await reason([{ role: "user", content: "x" }], { surface: "admin", callModel: model, tools: [tool("a")], executeTool: exec, maxRepeats: 2 });
    expect(exec).toHaveBeenCalledTimes(2);
    expect(r.toolCalls.map((t) => t.ok)).toEqual([true, true, false]);
    expect(r.output).toBe("fine");
  });

  it("times out a slow tool", async () => {
    const slow = () => new Promise<{ content: string }>((res) => setTimeout(() => res({ content: "late" }), 200));
    const r = await reason([{ role: "user", content: "x" }], {
      surface: "admin", callModel: scripted([useTools([call("slow")]), say("ok")]), tools: [tool("slow")], executeTool: slow, toolTimeoutMs: 20,
    });
    expect(r.toolCalls).toEqual([{ name: "slow", ok: false }]);
    expect(r.messages.find((m) => m.role === "tool")?.content).toMatch(/timed out/);
  });

  it("stops at the token budget and asks for a final answer without tools", async () => {
    const model = vi.fn(scripted([useTools([call("a")], 960), useTools([call("a", { b: 1 })])]));
    const r = await reason([{ role: "user", content: "x" }], {
      surface: "heartbeat", callModel: model, tools: [tool("a")], executeTool: async () => ({ content: "ok" }), tokenBudget: 1000,
    });
    expect(r.stopReason).toBe("token_budget");
    const last = model.mock.calls.at(-1)![0];
    expect(last.tools).toBeUndefined();
    expect(last.messages.at(-1)?.content).toMatch(/token budget/);
  });

  it("stops at max iterations and still answers", async () => {
    const model = scripted([useTools([call("a", { i: 1 })]), useTools([call("a", { i: 2 })])]);
    const r = await reason([{ role: "user", content: "x" }], {
      surface: "public", callModel: model, tools: [tool("a")], executeTool: async () => ({ content: "ok" }), maxIterations: 2,
    });
    expect(r).toMatchObject({ stopReason: "max_iterations", iterations: 2, output: "done" });
  });

  it("does not start a tool round after the deadline", async () => {
    let t = 0;
    const model = scripted([useTools([call("a")])]);
    const r = await reason([{ role: "user", content: "x" }], {
      surface: "heartbeat", callModel: model, tools: [tool("a")], executeTool: async () => { t = 100; return { content: "ok" }; },
      deadlineAt: 50, now: () => t,
    });
    expect(r.stopReason).toBe("deadline");
  });
});
