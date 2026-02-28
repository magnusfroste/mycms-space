// ============================================
// AI Chat Edge Function
// Thin HTTP handler — delegates to the Agent
// ============================================

import { runAgent } from "../_shared/ai-agent.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      messages: conversationHistory,
      sessionId,
      systemPrompt,
      siteContext,
      integration,
      enabledTools,
    } = await req.json();

    console.log("[AI Chat] Request:", {
      provider: integration?.type,
      messages: conversationHistory?.length,
      hasContext: !!siteContext,
    });

    if (!integration?.type) {
      throw new Error("Integration type is required");
    }

    const result = await runAgent({
      messages: conversationHistory || [],
      sessionId,
      systemPrompt: systemPrompt || '',
      siteContext: siteContext || null,
      enabledTools,
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
