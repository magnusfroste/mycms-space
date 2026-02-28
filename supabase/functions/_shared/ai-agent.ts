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

export type AgentProvider = 'lovable' | 'openai' | 'gemini' | 'n8n' | 'custom';

export interface AgentConfig {
  provider: AgentProvider;
  model?: string;
  webhookUrl?: string;   // n8n webhook
  baseUrl?: string;      // custom self-hosted endpoint (OpenAI-compatible)
  apiKeyEnv?: string;    // env var name for custom endpoint API key
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
// Generic OpenAI-Compatible Provider
// Works with: Lovable AI, OpenAI, Gemini (via gateway),
//             Ollama, LM Studio, vLLM, etc.
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

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Some self-hosted endpoints don't need auth
  if (params.apiKey) {
    headers.Authorization = `Bearer ${params.apiKey}`;
  }

  const response = await fetch(params.url, {
    method: "POST",
    headers,
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
// Provider Registry
// Each entry: endpoint URL, env var for API key, default model
// All use the OpenAI-compatible chat/completions format
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
  gemini: {
    url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    envKey: "GEMINI_API_KEY",
    defaultModel: "gemini-2.5-flash",
  },
};

// ============================================
// Main Agent Runner
// ============================================

/** Resolve provider config: endpoint, API key, model */
function resolveProvider(config: AgentConfig): { url: string; apiKey: string; model: string } {
  // Custom self-hosted endpoint
  if (config.provider === 'custom') {
    if (!config.baseUrl) throw new Error("Custom endpoint base URL is required");
    const envKey = config.apiKeyEnv || 'CUSTOM_AI_API_KEY';
    const apiKey = Deno.env.get(envKey) || '';
    return {
      url: config.baseUrl.endsWith('/chat/completions') 
        ? config.baseUrl 
        : `${config.baseUrl.replace(/\/+$/, '')}/v1/chat/completions`,
      apiKey,
      model: config.model || 'default',
    };
  }

  // Known provider
  const endpoint = providerEndpoints[config.provider];
  if (!endpoint) throw new Error(`Unsupported provider: ${config.provider}`);

  const apiKey = Deno.env.get(endpoint.envKey);
  if (!apiKey) throw new Error(`${endpoint.envKey} is not configured`);

  return {
    url: endpoint.url,
    apiKey,
    model: config.model || endpoint.defaultModel,
  };
}

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

  // --- All OpenAI-compatible providers: full tool support ---
  const { url, apiKey, model } = resolveProvider(config);

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
    url,
    apiKey,
    model,
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
