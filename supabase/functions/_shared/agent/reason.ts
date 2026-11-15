// ============================================
// reason() — the one reasoning core (ReAct loop) behind every agent surface:
// the visitor chat, Magnet in the admin, and the autonomous heartbeat.
//
// Pattern from FlowPilot (magnusfroste/flowwink): one loop, configured per
// surface with its tools, budgets and guards. Pure TypeScript — the model
// call and the tool executor are passed in — so it is unit-tested.
// ============================================

export interface ToolDefinition {
  type: "function";
  function: { name: string; description: string; parameters: Record<string, unknown> };
}

export interface ToolCall {
  id?: string;
  type?: string;
  function?: { name?: string; arguments?: string };
}

export interface ModelMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export interface ModelResponse {
  choices?: Array<{ message: { content?: string | null; tool_calls?: ToolCall[] }; finish_reason?: string }>;
  usage?: { total_tokens?: number };
}

export type CallModel = (req: { messages: ModelMessage[]; tools?: ToolDefinition[] }) => Promise<ModelResponse>;

export interface ToolOutcome {
  /** What the model sees as the tool result. */
  content: string;
  /** Chat artifacts (CV match, portfolio …) the surface should render. */
  artifacts?: Array<{ type: string; title: string; data: unknown }>;
  /** false when the tool failed; counts towards the circuit breaker. */
  ok?: boolean;
}

export type ExecuteTool = (name: string, args: Record<string, unknown>, call: ToolCall) => Promise<ToolOutcome>;

export type Surface = "public" | "admin" | "heartbeat";

export interface ReasonConfig {
  surface: Surface;
  callModel: CallModel;
  tools: ToolDefinition[];
  executeTool: ExecuteTool;
  /** Model turns that may call tools. Default 6. */
  maxIterations?: number;
  /** Stop calling tools when this many tokens are used (from usage.total_tokens). */
  tokenBudget?: number;
  /** Per tool call. Default 60 s. */
  toolTimeoutMs?: number;
  /** Absolute time (ms) after which no new tool round starts. */
  deadlineAt?: number;
  /** Consecutive failed tool calls before the loop stops calling tools. Default 3. */
  maxConsecutiveFailures?: number;
  /** The same tool with the same arguments, at most this many times. Default 2. */
  maxRepeats?: number;
  onToolCall?: (event: { name: string; ok: boolean; ms: number; iteration: number }) => void;
  now?: () => number;
}

export type StopReason = "answered" | "max_iterations" | "token_budget" | "deadline" | "circuit_breaker" | "no_response";

export interface ReasonResult {
  output: string;
  artifacts?: Array<{ type: string; title: string; data: unknown }>;
  stopReason: StopReason;
  iterations: number;
  tokensUsed: number;
  toolCalls: Array<{ name: string; ok: boolean }>;
  messages: ModelMessage[];
}

const FALLBACK_ANSWER = "I completed several actions. Check the activity log for details.";

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${Math.round(ms / 1000)} s`)), ms);
  });
  return Promise.race([p, timeout]).finally(() => clearTimeout(timer));
}

export async function reason(messages: ModelMessage[], cfg: ReasonConfig): Promise<ReasonResult> {
  const now = cfg.now ?? Date.now;
  const maxIterations = cfg.maxIterations ?? 6;
  const toolTimeoutMs = cfg.toolTimeoutMs ?? 60_000;
  const maxFailures = cfg.maxConsecutiveFailures ?? 3;
  const maxRepeats = cfg.maxRepeats ?? 2;
  const offered = new Set(cfg.tools.map((t) => t.function.name));
  const convo: ModelMessage[] = [...messages];
  const toolCalls: ReasonResult["toolCalls"] = [];
  const seen = new Map<string, number>();
  let tokensUsed = 0;
  let consecutiveFailures = 0;
  let artifacts: ReasonResult["artifacts"];
  let stop: StopReason = "max_iterations";
  let iteration = 0;

  const done = (output: string, stopReason: StopReason): ReasonResult => ({
    output, artifacts, stopReason, iterations: iteration, tokensUsed, toolCalls, messages: convo,
  });

  for (; iteration < maxIterations; iteration++) {
    if (cfg.deadlineAt && now() >= cfg.deadlineAt) { stop = "deadline"; break; }
    if (cfg.tokenBudget && tokensUsed >= cfg.tokenBudget * 0.95) { stop = "token_budget"; break; }

    const data = await cfg.callModel({ messages: convo, tools: cfg.tools.length ? cfg.tools : undefined });
    tokensUsed += data.usage?.total_tokens ?? 0;
    const msg = data.choices?.[0]?.message;
    if (!msg) return done("No response from AI.", "no_response");
    if (!msg.tool_calls?.length) return done(msg.content || "No response from AI.", "answered");

    convo.push({ role: "assistant", content: msg.content ?? null, tool_calls: msg.tool_calls });

    for (const call of msg.tool_calls) {
      const name = call.function?.name || "";
      const started = now();
      let outcome: ToolOutcome;
      try {
        if (!offered.has(name)) throw new Error(`Tool not available: ${name}`);
        let args: Record<string, unknown>;
        try { args = JSON.parse(call.function?.arguments || "{}"); } catch { throw new Error(`Arguments for ${name} are not valid JSON`); }
        const key = `${name}:${JSON.stringify(args)}`;
        const count = (seen.get(key) ?? 0) + 1;
        seen.set(key, count);
        if (count > maxRepeats) {
          outcome = { content: JSON.stringify({ error: `Already called ${name} with these arguments ${maxRepeats} times. Use the earlier result or try something else.` }), ok: false };
        } else {
          outcome = await withTimeout(cfg.executeTool(name, args, call), toolTimeoutMs, name);
        }
      } catch (e) {
        outcome = { content: JSON.stringify({ error: (e as Error).message }), ok: false };
      }
      const ok = outcome.ok !== false;
      if (outcome.artifacts?.length) artifacts = outcome.artifacts;
      consecutiveFailures = ok ? 0 : consecutiveFailures + 1;
      toolCalls.push({ name, ok });
      cfg.onToolCall?.({ name, ok, ms: now() - started, iteration });
      convo.push({ role: "tool", content: outcome.content, tool_call_id: call.id || `call_${iteration}_${name}` });
    }

    if (consecutiveFailures >= maxFailures) { stop = "circuit_breaker"; iteration++; break; }
  }

  // Out of turns, budget, time or luck: one last turn without tools for an answer.
  const note: Record<StopReason, string> = {
    answered: "", no_response: "",
    max_iterations: "You have used all tool turns.",
    token_budget: "The token budget is spent.",
    deadline: "Time is up.",
    circuit_breaker: `${maxFailures} tool calls in a row failed.`,
  };
  const ask = cfg.surface === "heartbeat"
    ? "Do not call more tools. Summarise what was done, what failed and what is left."
    : "Do not call more tools. Answer now with what you have.";
  convo.push({ role: "user", content: `${note[stop]} ${ask}` });
  try {
    const final = await cfg.callModel({ messages: convo });
    tokensUsed += final.usage?.total_tokens ?? 0;
    return done(final.choices?.[0]?.message?.content || FALLBACK_ANSWER, stop);
  } catch {
    return done(FALLBACK_ANSWER, stop);
  }
}
