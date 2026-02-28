// ============================================
// AI Agent Module
// Orchestrates context, tools, and provider calls
// Separates "agent intelligence" from "API transport"
// ============================================

import { buildDynamicPrompt, loadResumeContext } from "./ai-context.ts";
import { getActiveTools, getToolInstructions, parseToolCallResponse } from "./ai-tools.ts";
import type { SiteContext, ChatMessage } from "./ai-context.ts";

// ============================================
// Types
// ============================================

export interface AgentConfig {
  provider: 'lovable' | 'openai' | 'gemini' | 'n8n';
  model?: string;
  webhookUrl?: string;
}

export interface AgentRequest {
  messages: ChatMessage[];
  sessionId?: string;
  systemPrompt: string;
  siteContext: SiteContext | null;
  enabledTools?: string[];
  config: AgentConfig;
}

export interface AgentResult {
  output: string;
  artifacts?: Array<{ type: string; title: string; data: unknown }>;
}

// ============================================
// Provider: OpenAI-Compatible (Lovable AI + OpenAI)
// Supports tool calling natively
// ============================================

async function callOpenAICompatible(params: {
  url: string;
  apiKey: string;
  model: string;
  messages: Array<{ role: string; content: string }>;
  tools?: unknown[];
  toolChoice?: unknown;
}): Promise<{ choices: Array<{ message: { content?: string; tool_calls?: Array<{ function?: { name?: string; arguments?: string } }> } }> }> {
  const body: Record<string, unknown> = {
    model: params.model,
    messages: params.messages,
    stream: false,
  };

  if (params.tools?.length) {
    body.tools = params.tools;
    body.tool_choice = params.toolChoice || "auto";
  }

  const response = await fetch(params.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    if (response.status === 429) throw new Error("Rate limit exceeded. Please try again later.");
    if (response.status === 402) throw new Error("AI credits exhausted. Please add funds to your workspace.");
    const errorText = await response.text();
    throw new Error(`AI provider error (${response.status}): ${errorText}`);
  }

  return response.json();
}

// ============================================
// Provider: Gemini (different API format, no tools)
// ============================================

async function callGemini(params: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  messages: ChatMessage[];
}): Promise<string> {
  const contents = [];

  if (params.systemPrompt) {
    contents.push({ role: "user", parts: [{ text: `[System]: ${params.systemPrompt}` }] });
    contents.push({ role: "model", parts: [{ text: "Understood. I will follow these instructions." }] });
  }

  for (const msg of params.messages) {
    contents.push({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    });
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${params.model}:generateContent?key=${params.apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini.";
}

// ============================================
// Provider: n8n Webhook (external agent, no tools)
// ============================================

async function callN8n(params: {
  webhookUrl: string;
  messages: ChatMessage[];
  sessionId: string;
  systemPrompt: string;
  siteContext: SiteContext | null;
}): Promise<string> {
  const body: Record<string, unknown> = {
    messages: params.messages,
    sessionId: params.sessionId,
    systemPrompt: params.systemPrompt,
  };

  if (params.siteContext) body.siteContext = params.siteContext;

  const response = await fetch(params.webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`n8n webhook error (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  if (Array.isArray(data) && data.length > 0) {
    return data[0]?.output || data[0]?.message || JSON.stringify(data[0]);
  }
  return data.output || data.message || (typeof data === "string" ? data : JSON.stringify(data));
}

// ============================================
// Provider Configs
// ============================================

const providerEndpoints: Record<string, { url: string; envKey: string; defaultModel: string }> = {
  lovable: {
    url: "https://ai.gateway.lovable.dev/v1/chat/completions",
    envKey: "LOVABLE_API_KEY",
    defaultModel: "google/gemini-3-flash-preview",
  },
  openai: {
    url: "https://api.openai.com/v1/chat/completions",
    envKey: "OPENAI_API_KEY",
    defaultModel: "gpt-4o",
  },
};

// ============================================
// Main Agent Runner
// ============================================

/** Run the Magnet agent: loads context, builds prompt, calls provider, handles tools */
export async function runAgent(request: AgentRequest): Promise<AgentResult> {
  const { messages, sessionId, systemPrompt, siteContext, enabledTools, config } = request;

  console.log(`[Agent] Provider: ${config.provider}, Model: ${config.model || 'default'}`);

  // --- n8n: delegate entirely to external agent ---
  if (config.provider === 'n8n') {
    if (!config.webhookUrl) throw new Error("n8n webhook URL is required");
    const fullPrompt = buildDynamicPrompt(systemPrompt, siteContext);
    const output = await callN8n({
      webhookUrl: config.webhookUrl,
      messages,
      sessionId: sessionId || "default",
      systemPrompt: fullPrompt,
      siteContext,
    });
    return { output };
  }

  // --- Gemini direct: no tool calling support ---
  if (config.provider === 'gemini') {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
    const fullPrompt = buildDynamicPrompt(systemPrompt, siteContext);
    const output = await callGemini({
      apiKey,
      model: config.model || "gemini-1.5-flash",
      systemPrompt: fullPrompt,
      messages,
    });
    return { output };
  }

  // --- OpenAI-compatible providers (Lovable AI, OpenAI): full tool support ---
  const providerConfig = providerEndpoints[config.provider];
  if (!providerConfig) throw new Error(`Unsupported provider: ${config.provider}`);

  const apiKey = Deno.env.get(providerConfig.envKey);
  if (!apiKey) throw new Error(`${providerConfig.envKey} is not configured`);

  // Load resume context for tool calling
  const resumeContext = await loadResumeContext();

  // Build full system prompt
  let fullPrompt = buildDynamicPrompt(systemPrompt, siteContext);
  if (resumeContext) {
    fullPrompt += `\n\n## Magnus's Complete Profile\n${resumeContext}`;
    fullPrompt += getToolInstructions(enabledTools);
  }

  // Prepare tools
  const tools = resumeContext ? getActiveTools(enabledTools) : [];
  console.log(`[Agent] ${tools.length} tools enabled: ${tools.map(t => t.function.name).join(', ')}`);

  // Call provider
  const data = await callOpenAICompatible({
    url: providerConfig.url,
    apiKey,
    model: config.model || providerConfig.defaultModel,
    messages: [
      { role: "system", content: fullPrompt },
      ...messages,
    ],
    tools: tools.length > 0 ? tools : undefined,
  });

  const choice = data.choices?.[0];

  // Handle tool calls
  if (choice?.message?.tool_calls?.length) {
    const toolCall = choice.message.tool_calls[0];
    console.log(`[Agent] Tool called: ${toolCall.function?.name}`);
    return parseToolCallResponse(toolCall, choice.message.content || "");
  }

  return { output: choice?.message?.content || "No response from AI." };
}
