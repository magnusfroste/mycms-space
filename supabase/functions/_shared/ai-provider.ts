// ============================================
// Shared AI Provider Utility
// Thin wrapper over ai-agent's provider registry
// Used by admin tools (PromptEnhancer, AITextActions, PageBuilderChat)
// ============================================

import { createClient } from "npm:@supabase/supabase-js@2";
import { callOpenAICompatible, providerEndpoints } from "./ai-agent.ts";

export interface AIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
}

export interface AICompletionOptions {
  messages: AIMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  tools?: unknown[];
  tool_choice?: unknown;
}

export interface AIProviderConfig {
  active_integration: 'lovable' | 'openai' | 'gemini' | 'n8n';
  admin_ai_provider?: 'lovable' | 'openai' | 'gemini';
  admin_ai_config?: {
    model?: string;
  };
  integration?: {
    webhook_url?: string;
    model?: string;
  };
}

interface ProviderResult {
  response?: Response;
  error?: string;
  status?: number;
}

// ============================================
// Database Config Loader
// ============================================

export async function getAIModuleConfig(): Promise<AIProviderConfig | null> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  if (!supabaseUrl || !supabaseKey) {
    console.log("Supabase config missing, using default provider");
    return null;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from('modules')
      .select('module_config')
      .eq('module_type', 'ai')
      .single();
    
    if (error || !data) {
      console.log("Could not fetch AI module config:", error?.message);
      return null;
    }
    
    return data.module_config as AIProviderConfig;
  } catch (e) {
    console.error("Error fetching AI config:", e);
    return null;
  }
}

export function getActiveProviderName(config: AIProviderConfig | null): string {
  if (!config) return 'Lovable AI';
  switch (config.active_integration) {
    case 'openai': return 'OpenAI';
    case 'gemini': return 'Google Gemini';
    case 'n8n': return 'n8n Webhook';
    case 'lovable': 
    default: return 'Lovable AI';
  }
}

// ============================================
// Unified Provider Call
// Uses the same registry & transport as ai-agent.ts
// ============================================

async function callProvider(
  providerName: string,
  options: AICompletionOptions,
  model: string,
  webhookUrl?: string,
): Promise<ProviderResult> {
  // n8n is special — simple webhook, no OpenAI format
  if (providerName === 'n8n') {
    if (!webhookUrl) return { error: "n8n webhook URL is not configured.", status: 500 };
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: options.messages,
        temperature: options.temperature,
        max_tokens: options.max_tokens,
      }),
    });
    return { response };
  }

  // All other providers use the shared registry
  const endpoint = providerEndpoints[providerName];
  if (!endpoint) return { error: `Unsupported provider: ${providerName}`, status: 500 };

  const apiKey = Deno.env.get(endpoint.envKey);
  if (!apiKey) {
    return { error: `${endpoint.envKey} is not configured. Add it in backend secrets.`, status: 500 };
  }

  try {
    const data = await callOpenAICompatible({
      url: endpoint.url,
      apiKey,
      model: model || endpoint.defaultModel,
      messages: options.messages.map(m => ({ role: m.role, content: m.content })),
      tools: options.tools,
      toolChoice: options.tool_choice,
    });

    return {
      response: new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI provider error";
    console.error(`[Provider] ${providerName} error:`, msg);
    
    if (msg.includes("Rate limit")) return { error: msg, status: 429 };
    if (msg.includes("credits")) return { error: msg, status: 402 };
    return { error: msg, status: 500 };
  }
}

// ============================================
// Public API — Chat & Admin Completions
// ============================================

export async function getAICompletion(
  options: AICompletionOptions,
  configOverride?: AIProviderConfig | null
): Promise<ProviderResult> {
  const config = configOverride ?? await getAIModuleConfig();
  const provider = config?.active_integration || 'lovable';
  const model = config?.integration?.model || 'google/gemini-3-flash-preview';
  
  console.log(`Chat AI Provider: ${provider}, Model: ${model}`);
  return callProvider(provider, options, model, config?.integration?.webhook_url);
}

export async function getAdminAICompletion(
  options: AICompletionOptions,
  configOverride?: AIProviderConfig | null
): Promise<ProviderResult> {
  const config = configOverride ?? await getAIModuleConfig();
  const provider = config?.admin_ai_provider || 'lovable';
  const model = config?.admin_ai_config?.model || 'google/gemini-2.5-flash';
  
  console.log(`Admin AI Provider: ${provider}, Model: ${model}`);
  return callProvider(provider, options, model);
}

// ============================================
// Error Helpers
// ============================================

export function handleProviderError(result: ProviderResult, corsHeaders: Record<string, string>): Response | null {
  if (result.error) {
    return new Response(
      JSON.stringify({ error: result.error }),
      { status: result.status || 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  return null;
}

export async function handleResponseErrors(
  response: Response, 
  corsHeaders: Record<string, string>
): Promise<Response | null> {
  if (response.ok) return null;
  
  const status = response.status;
  const errorText = await response.text();
  console.error(`AI provider error: ${status}`, errorText);
  
  if (status === 429) {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  if (status === 402) {
    return new Response(
      JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
      { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  return new Response(
    JSON.stringify({ error: 'AI service error. Please try again.' }),
    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
