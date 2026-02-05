// ============================================
// Shared AI Provider Utility
// Routes AI requests to configured provider
// ============================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

// Fetch AI module config from database
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

// Get the active provider name for display
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

// Call Lovable AI Gateway
async function callLovable(options: AICompletionOptions, model: string): Promise<ProviderResult> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    return { 
      error: "LOVABLE_API_KEY is not configured. This is auto-configured in Lovable Cloud.",
      status: 500 
    };
  }
  
  const body: Record<string, unknown> = {
    model,
    messages: options.messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens ?? 2000,
    stream: options.stream ?? false,
  };
  
  if (options.tools) {
    body.tools = options.tools;
  }
  if (options.tool_choice) {
    body.tool_choice = options.tool_choice;
  }
  
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  
  return { response };
}

// Call OpenAI API
async function callOpenAI(options: AICompletionOptions, model: string): Promise<ProviderResult> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    return { 
      error: "OPENAI_API_KEY is not configured. Add it in backend secrets for self-hosting.",
      status: 500 
    };
  }
  
  const body: Record<string, unknown> = {
    model: model || "gpt-4o-mini",
    messages: options.messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens ?? 2000,
    stream: options.stream ?? false,
  };
  
  if (options.tools) {
    body.tools = options.tools;
  }
  if (options.tool_choice) {
    body.tool_choice = options.tool_choice;
  }
  
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  
  return { response };
}

// Call Google Gemini API
async function callGemini(options: AICompletionOptions, model: string): Promise<ProviderResult> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    return { 
      error: "GEMINI_API_KEY is not configured. Add it in backend secrets for self-hosting.",
      status: 500 
    };
  }
  
  // Convert messages to Gemini format
  const geminiModel = model || "gemini-1.5-flash";
  const systemMessage = options.messages.find(m => m.role === 'system');
  const otherMessages = options.messages.filter(m => m.role !== 'system');
  
  const contents = otherMessages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));
  
  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.max_tokens ?? 2000,
    },
  };
  
  if (systemMessage) {
    body.systemInstruction = { parts: [{ text: systemMessage.content }] };
  }
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  
  if (!response.ok) {
    return { response };
  }
  
  // Convert Gemini response to OpenAI-compatible format
  const geminiData = await response.json();
  const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  const openAIFormat = {
    choices: [{
      message: { role: 'assistant', content: text },
      finish_reason: 'stop',
    }]
  };
  
  return { 
    response: new Response(JSON.stringify(openAIFormat), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  };
}

// Call n8n Webhook
async function callN8N(options: AICompletionOptions, webhookUrl: string): Promise<ProviderResult> {
  if (!webhookUrl) {
    return { 
      error: "n8n webhook URL is not configured. Set it in AI Module settings.",
      status: 500 
    };
  }
  
  // n8n expects a simpler format - send messages directly
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

// Main function to get AI completion for CHAT using configured provider
export async function getAICompletion(
  options: AICompletionOptions,
  configOverride?: AIProviderConfig | null
): Promise<ProviderResult> {
  // Get config from database or use override
  const config = configOverride ?? await getAIModuleConfig();
  
  // Default to Lovable if no config
  const provider = config?.active_integration || 'lovable';
  const model = config?.integration?.model || 'google/gemini-3-flash-preview';
  
  console.log(`Chat AI Provider: ${provider}, Model: ${model}`);
  
  switch (provider) {
    case 'openai':
      return callOpenAI(options, model);
    
    case 'gemini':
      return callGemini(options, model);
    
    case 'n8n':
      return callN8N(options, config?.integration?.webhook_url || '');
    
    case 'lovable':
    default:
      return callLovable(options, model);
  }
}

// Admin AI completion for internal tools (PromptEnhancer, AITextActions, PageBuilderChat)
// Uses admin_ai_provider - does NOT support n8n tool calls
export async function getAdminAICompletion(
  options: AICompletionOptions,
  configOverride?: AIProviderConfig | null
): Promise<ProviderResult> {
  // Get config from database or use override
  const config = configOverride ?? await getAIModuleConfig();
  
  // Use admin_ai_provider, fallback to 'lovable'
  const provider = config?.admin_ai_provider || 'lovable';
  const model = config?.admin_ai_config?.model || 'google/gemini-2.5-flash';
  
  console.log(`Admin AI Provider: ${provider}, Model: ${model}`);
  
  switch (provider) {
    case 'openai':
      return callOpenAI(options, model);
    
    case 'gemini':
      return callGemini(options, model);
    
    case 'lovable':
    default:
      return callLovable(options, model);
  }
}

// Helper to handle standard error responses
export function handleProviderError(result: ProviderResult, corsHeaders: Record<string, string>): Response | null {
  if (result.error) {
    return new Response(
      JSON.stringify({ error: result.error }),
      { status: result.status || 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  return null;
}

// Helper to handle rate limit and payment errors
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
