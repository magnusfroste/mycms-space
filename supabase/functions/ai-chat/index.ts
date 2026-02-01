// ============================================
// Universal AI Chat Edge Function
// Supports: n8n webhook, Lovable AI, OpenAI, Gemini
// ============================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface SiteContext {
  pages?: Array<{
    slug: string;
    title: string;
    content: string;
    blocks?: Array<{ type: string; content: string }>;
  }>;
  blogs?: Array<{
    slug: string;
    title: string;
    excerpt?: string;
    content: string;
  }>;
}

interface IntegrationConfig {
  type: "n8n" | "lovable" | "openai" | "gemini";
  webhook_url?: string;
  model?: string;
}

// Build system prompt with site context
function buildSystemPrompt(siteContext: SiteContext | null): string {
  let prompt = `You are a helpful AI assistant. You answer questions clearly and concisely.`;

  if (siteContext) {
    prompt += `\n\n## Site Context\n\nYou have access to information about this website:\n`;

    if (siteContext.pages && siteContext.pages.length > 0) {
      prompt += `\n### Pages\n`;
      for (const page of siteContext.pages) {
        prompt += `\n**${page.title}** (/${page.slug})\n`;
        if (page.content) prompt += `${page.content}\n`;
        if (page.blocks && page.blocks.length > 0) {
          for (const block of page.blocks) {
            if (block.content) prompt += `- ${block.type}: ${block.content}\n`;
          }
        }
      }
    }

    if (siteContext.blogs && siteContext.blogs.length > 0) {
      prompt += `\n### Blog Posts\n`;
      for (const post of siteContext.blogs) {
        prompt += `\n**${post.title}** (/${post.slug})\n`;
        if (post.excerpt) prompt += `${post.excerpt}\n`;
        if (post.content) prompt += `${post.content.substring(0, 500)}...\n`;
      }
    }
  }

  return prompt;
}

// Handler for n8n webhook
async function handleN8n(
  message: string,
  sessionId: string,
  webhookUrl: string,
  siteContext: SiteContext | null
): Promise<string> {
  console.log("Calling n8n webhook:", webhookUrl);

  const body: Record<string, unknown> = {
    message,
    sessionId,
  };

  if (siteContext) {
    body.siteContext = siteContext;
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`n8n webhook error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  // Handle various n8n response formats
  if (Array.isArray(data) && data.length > 0) {
    return data[0]?.output || data[0]?.message || JSON.stringify(data[0]);
  }
  if (data.output) return data.output;
  if (data.message) return data.message;
  if (typeof data === "string") return data;

  return JSON.stringify(data);
}

// Handler for Lovable AI
async function handleLovableAI(
  messages: ChatMessage[],
  model: string,
  siteContext: SiteContext | null
): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY is not configured");
  }

  console.log("Calling Lovable AI with model:", model);

  const systemPrompt = buildSystemPrompt(siteContext);

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model || "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      stream: false,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    if (response.status === 402) {
      throw new Error("AI credits exhausted. Please add funds to your workspace.");
    }
    const errorText = await response.text();
    throw new Error(`Lovable AI error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "No response from AI.";
}

// Handler for OpenAI
async function handleOpenAI(
  messages: ChatMessage[],
  model: string,
  siteContext: SiteContext | null
): Promise<string> {
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured in Supabase secrets");
  }

  console.log("Calling OpenAI with model:", model);

  const systemPrompt = buildSystemPrompt(siteContext);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model || "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "No response from OpenAI.";
}

// Handler for Gemini
async function handleGemini(
  messages: ChatMessage[],
  model: string,
  siteContext: SiteContext | null
): Promise<string> {
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured in Supabase secrets");
  }

  console.log("Calling Gemini with model:", model);

  const systemPrompt = buildSystemPrompt(siteContext);
  const geminiModel = model || "gemini-1.5-flash";

  // Convert messages to Gemini format
  const contents = [];

  // Add system instruction as first user message for context
  if (systemPrompt) {
    contents.push({
      role: "user",
      parts: [{ text: `[System]: ${systemPrompt}` }],
    });
    contents.push({
      role: "model",
      parts: [{ text: "Understood. I will follow these instructions." }],
    });
  }

  // Add conversation history
  for (const msg of messages) {
    contents.push({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    });
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini.";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      message,
      messages: conversationHistory,
      sessionId,
      siteContext,
      integration,
    } = await req.json();

    console.log("AI Chat request:", {
      integrationType: integration?.type,
      hasMessage: !!message,
      historyLength: conversationHistory?.length,
      hasContext: !!siteContext,
    });

    // Validate integration config
    if (!integration?.type) {
      throw new Error("Integration type is required");
    }

    // Build messages array from current message + history
    const messages: ChatMessage[] = conversationHistory || [];
    if (message) {
      messages.push({ role: "user", content: message });
    }

    let responseText: string;

    switch (integration.type) {
      case "n8n":
        if (!integration.webhook_url) {
          throw new Error("n8n webhook URL is required");
        }
        responseText = await handleN8n(
          message,
          sessionId || "default",
          integration.webhook_url,
          siteContext
        );
        break;

      case "lovable":
        responseText = await handleLovableAI(
          messages,
          integration.model || "google/gemini-3-flash-preview",
          siteContext
        );
        break;

      case "openai":
        responseText = await handleOpenAI(
          messages,
          integration.model || "gpt-4o",
          siteContext
        );
        break;

      case "gemini":
        responseText = await handleGemini(
          messages,
          integration.model || "gemini-1.5-flash",
          siteContext
        );
        break;

      default:
        throw new Error(`Unsupported integration type: ${integration.type}`);
    }

    console.log("AI response length:", responseText.length);

    return new Response(
      JSON.stringify({ output: responseText }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("AI Chat error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
