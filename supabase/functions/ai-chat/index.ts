// ============================================
// AI Chat Edge Function
// Thin HTTP handler — delegates to the Agent
// ============================================

import { createClient } from "npm:@supabase/supabase-js@2";
import { runAgent } from "../_shared/ai-agent.ts";
import { isAdminRequest } from "../_shared/cron-auth.ts";
import { clientIp, isRateLimited, tooManyRequests } from "../_shared/rate-limit.ts";

// Public requests: cap conversation size to limit cost abuse.
const MAX_PUBLIC_MESSAGES = 40;
const MAX_PUBLIC_MESSAGE_CHARS = 8000;

// Provider config for visitors always comes from the database (ai module),
// never from the request body — the client must not choose endpoint or key.
// deno-lint-ignore no-explicit-any
async function loadPublicAIConfig(): Promise<{ integration: any; systemPrompt: string }> {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data } = await supabase
    .from("modules")
    .select("module_config")
    .eq("module_type", "ai")
    .maybeSingle();
  // deno-lint-ignore no-explicit-any
  const cfg = (data?.module_config ?? {}) as any;
  const active = cfg.active_integration || "openai";
  return {
    integration: {
      type: active,
      ...(cfg.integration || {}),
      webhook_url: active === "n8n" ? cfg.webhook_url : undefined,
    },
    systemPrompt: cfg.system_prompt || "",
  };
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { sessionId, siteContext, enabledTools, visitorConfig } = body;

    // Admin mode (private knowledge, write tools, client-chosen provider)
    // requires a signed-in admin. Everyone else gets public mode with the
    // provider and system prompt loaded server-side.
    const isAdmin = body.mode === "admin" && await isAdminRequest(req);
    const mode: "admin" | "public" = isAdmin ? "admin" : "public";

    let conversationHistory = Array.isArray(body.messages) ? body.messages : [];
    let integration = body.integration;
    let systemPrompt = body.systemPrompt;

    if (!isAdmin) {
      if (await isRateLimited(`ai-chat:${clientIp(req)}`, 600, 30)) {
        return tooManyRequests(corsHeaders);
      }
      const publicConfig = await loadPublicAIConfig();
      integration = publicConfig.integration;
      systemPrompt = publicConfig.systemPrompt;
      conversationHistory = conversationHistory
        .slice(-MAX_PUBLIC_MESSAGES)
        // deno-lint-ignore no-explicit-any
        .map((m: any) => typeof m?.content === "string" && m.content.length > MAX_PUBLIC_MESSAGE_CHARS
          ? { ...m, content: m.content.slice(0, MAX_PUBLIC_MESSAGE_CHARS) }
          : m);
    }

    console.log("[AI Chat] Request:", {
      provider: integration?.type,
      messages: conversationHistory?.length,
      hasContext: !!siteContext,
      mode,
    });

    if (!integration?.type) {
      throw new Error("Integration type is required");
    }

    const result = await runAgent({
      messages: conversationHistory,
      sessionId,
      systemPrompt: systemPrompt || '',
      siteContext: siteContext || null,
      enabledTools,
      mode,
      visitorConfig: visitorConfig || undefined,
      config: {
        provider: integration.type,
        model: integration.model,
        webhookUrl: integration.webhook_url,
        baseUrl: integration.base_url,
        apiKeyEnv: integration.api_key_env,
      },
    });

    console.log("[AI Chat] Response length:", result.output.length, "artifacts:", result.artifacts?.length || 0);

    const responseBody: Record<string, unknown> = { output: result.output };
    if (result.artifacts?.length) {
      responseBody.artifacts = result.artifacts;
    }
    if (result.client_action) {
      responseBody.client_action = result.client_action;
    }

    return new Response(
      JSON.stringify(responseBody),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[AI Chat] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
