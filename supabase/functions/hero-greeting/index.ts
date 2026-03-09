// ============================================
// Hero Greeting Edge Function
// Generates a dynamic, contextual greeting via AI
// Uses visitor insights + agent memory for personalization
// ============================================

import { createClient } from "npm:@supabase/supabase-js@2";
import { getAICompletion, getAIModuleConfig, handleProviderError } from "../_shared/ai-provider.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { visitorContext, agentName } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Load agent personality from memory
    let personality = "";
    try {
      const { data: memories } = await supabase
        .from("agent_memory")
        .select("content")
        .eq("category", "soul")
        .limit(5);
      
      if (memories?.length) {
        personality = memories.map((m: { content: string }) => m.content).join("\n");
      }
    } catch (e) {
      console.log("Could not load agent memory:", e);
    }

    // Build context string from visitor insights
    const now = new Date();
    const hour = now.getHours();
    const timeOfDay = hour < 6 ? "night" : hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
    
    let contextParts: string[] = [`Current time: ${timeOfDay}`];
    
    if (visitorContext) {
      if (visitorContext.isReturning) {
        contextParts.push(`Returning visitor (visit #${visitorContext.visitCount})`);
        if (visitorContext.daysSinceLastVisit !== null) {
          contextParts.push(`Last visit: ${visitorContext.daysSinceLastVisit} days ago`);
        }
      } else {
        contextParts.push("First-time visitor");
      }
      if (visitorContext.referrer) {
        contextParts.push(`Came from: ${visitorContext.referrer}`);
      }
      if (visitorContext.utmSource) {
        contextParts.push(`UTM source: ${visitorContext.utmSource}`);
      }
      if (visitorContext.topPages?.length) {
        contextParts.push(`Previously visited: ${visitorContext.topPages.join(", ")}`);
      }
      if (visitorContext.currentSession?.length > 1) {
        contextParts.push(`This session: ${visitorContext.currentSession.join(" → ")}`);
      }
    }

    const systemPrompt = `You are ${agentName || "Magnet"}, a digital AI assistant greeting visitors on a personal portfolio website.

${personality ? `Your personality:\n${personality}\n` : ""}

Generate a single short, warm greeting (1 sentence, max 80 characters) for this visitor. 
Be conversational, human, and slightly playful. Make them want to respond.
Do NOT use quotes around your response.
Do NOT include emojis.
Do NOT start with "Hey there!" every time — vary your openings.

Visitor context:
${contextParts.join("\n")}`;

    const config = await getAIModuleConfig();
    
    const result = await getAICompletion({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Generate a greeting for this visitor." },
      ],
      temperature: 0.9,
      max_tokens: 60,
    }, config);

    const errorResponse = handleProviderError(result, corsHeaders);
    if (errorResponse) return errorResponse;

    // Extract text from response
    const responseData = await result.response!.json();
    const greeting = responseData.choices?.[0]?.message?.content?.trim() 
      || "How can I help you today?";

    return new Response(
      JSON.stringify({ greeting }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[hero-greeting] Error:", e);
    return new Response(
      JSON.stringify({ greeting: null, error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
