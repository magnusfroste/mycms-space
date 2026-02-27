// ============================================
// Universal AI Chat Edge Function
// Supports: n8n webhook, Lovable AI, OpenAI, Gemini
// Features: Modular dynamic context, CV Agent tool calling
// ============================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  repos?: Array<{
    name: string;
    description: string;
    enrichedDescription?: string;
    problemStatement?: string;
    whyItMatters?: string;
    language?: string;
    topics?: string[];
    url: string;
  }>;
}

interface IntegrationConfig {
  type: "n8n" | "lovable" | "openai" | "gemini";
  webhook_url?: string;
  model?: string;
}

// ============================================
// Resume Context Loader (Server-side)
// ============================================

async function loadResumeContext(): Promise<string | null> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) return null;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Load all page blocks to find resume/CV content
    const { data: blocks, error } = await supabase
      .from("page_blocks")
      .select("block_type, block_config, page_slug")
      .eq("enabled", true)
      .order("order_index");

    if (error || !blocks?.length) {
      console.log("[CV Agent] No page blocks found for resume context");
      return null;
    }

    // Extract text content from all blocks across all pages
    const sections: string[] = [];

    for (const block of blocks) {
      const config = block.block_config as Record<string, unknown>;
      if (!config) continue;

      const pageParts: string[] = [];

      // Extract common text fields
      if (config.name) pageParts.push(`Name: ${config.name}`);
      if (config.tagline) pageParts.push(`Tagline: ${config.tagline}`);
      if (config.intro_text) pageParts.push(`About: ${config.intro_text}`);
      if (config.additional_text) pageParts.push(`${config.additional_text}`);
      if (config.title && typeof config.title === 'string') pageParts.push(`${config.title}`);
      if (config.content && typeof config.content === 'string') pageParts.push(`${config.content}`);

      // Extract skills
      if (Array.isArray(config.skills)) {
        const skills = config.skills as Array<{ name?: string; level?: number; category?: string }>;
        const skillTexts = skills.map(s => `${s.name || ''} (${s.level || 0}%, ${s.category || ''})`);
        if (skillTexts.length) pageParts.push(`Skills: ${skillTexts.join(', ')}`);
      }

      // Extract values
      if (Array.isArray(config.values)) {
        const vals = config.values as Array<{ title?: string; description?: string }>;
        const valTexts = vals.map(v => `${v.title}: ${v.description}`);
        if (valTexts.length) pageParts.push(`Values: ${valTexts.join('; ')}`);
      }

      // Extract expertise/services
      if (Array.isArray(config.items)) {
        const items = config.items as Array<{ title?: string; description?: string }>;
        const itemTexts = items.filter(i => i.title).map(i => `${i.title}: ${i.description || ''}`);
        if (itemTexts.length) pageParts.push(`${block.block_type}: ${itemTexts.join('; ')}`);
      }

      // Extract projects
      if (Array.isArray(config.projects)) {
        const projects = config.projects as Array<{
          title?: string; description?: string;
          problem_statement?: string; why_built?: string;
        }>;
        for (const p of projects) {
          const parts = [`Project: ${p.title}`];
          if (p.description) parts.push(p.description);
          if (p.problem_statement) parts.push(`Problem: ${p.problem_statement}`);
          if (p.why_built) parts.push(`Why: ${p.why_built}`);
          pageParts.push(parts.join(' - '));
        }
      }

      // Extract features
      if (Array.isArray(config.features)) {
        const features = config.features as Array<{ text?: string }>;
        const featureTexts = features.map(f => f.text).filter(Boolean);
        if (featureTexts.length) pageParts.push(`Features: ${featureTexts.join(', ')}`);
      }

      if (pageParts.length) {
        sections.push(`[${block.page_slug}/${block.block_type}]\n${pageParts.join('\n')}`);
      }
    }

    if (!sections.length) return null;

    console.log(`[CV Agent] Loaded resume context: ${sections.length} block sections`);
    return sections.join('\n\n');
  } catch (e) {
    console.error("[CV Agent] Failed to load resume context:", e);
    return null;
  }
}

// ============================================
// CV Agent Tool Definition
// ============================================

const cvAgentTool = {
  type: "function" as const,
  function: {
    name: "generate_tailored_cv",
    description: "Analyze a job description against Magnus's profile and generate a match analysis, tailored CV, and cover letter. Use this tool when a user pastes a job description or asks about job fit.",
    parameters: {
      type: "object",
      properties: {
        overall_score: {
          type: "number",
          description: "Overall match score 0-100 based on how well Magnus fits the job requirements",
        },
        summary: {
          type: "string",
          description: "One-line summary of the match (e.g., 'Strong match in product strategy and AI, gap in specific industry experience')",
        },
        match_analysis: {
          type: "array",
          description: "Detailed skill-by-skill match analysis",
          items: {
            type: "object",
            properties: {
              skill: { type: "string", description: "Skill or requirement name from the JD" },
              required_level: { type: "number", description: "How important this skill is for the role (0-100)" },
              magnus_level: { type: "number", description: "Magnus's proficiency level (0-100)" },
              category: { type: "string", description: "Category like 'Technical', 'Leadership', 'Domain', 'Soft Skills'" },
            },
            required: ["skill", "required_level", "magnus_level", "category"],
          },
        },
        tailored_cv: {
          type: "string",
          description: "A tailored CV in markdown format, highlighting the most relevant experience and skills for this specific role",
        },
        cover_letter: {
          type: "string",
          description: "A professional cover letter in markdown format, tailored to the specific role and company",
        },
      },
      required: ["overall_score", "summary", "match_analysis", "tailored_cv", "cover_letter"],
    },
  },
};

// ============================================
// Context Section Builders (Modular Pattern)
// ============================================

interface ContextSection {
  key: string;
  title: string;
  instruction: string;
  formatData: (data: unknown[]) => string;
}

const contextSections: ContextSection[] = [
  {
    key: 'repos',
    title: 'GitHub Projects',
    instruction: `You have knowledge about Magnus's GitHub projects. Use this to answer questions about his technical work, coding skills, and project experience.`,
    formatData: (repos: SiteContext['repos']) => {
      if (!repos?.length) return '';
      return repos.map(repo => {
        let section = `\n### ${repo.name}\n`;
        if (repo.description) section += `${repo.description}\n`;
        if (repo.enrichedDescription) section += `${repo.enrichedDescription}\n`;
        if (repo.problemStatement) section += `**Problem solved:** ${repo.problemStatement}\n`;
        if (repo.whyItMatters) section += `**Why it matters:** ${repo.whyItMatters}\n`;
        if (repo.language) section += `**Language:** ${repo.language}\n`;
        if (repo.topics?.length) section += `**Topics:** ${repo.topics.join(', ')}\n`;
        section += `**URL:** ${repo.url}\n`;
        return section;
      }).join('\n');
    }
  },
  {
    key: 'pages',
    title: 'Website Content',
    instruction: `You have access to content from the website. Use this to provide accurate information about Magnus and his services.`,
    formatData: (pages: SiteContext['pages']) => {
      if (!pages?.length) return '';
      return pages.map(page => {
        let section = `\n### ${page.title} (/${page.slug})\n`;
        if (page.content) section += `${page.content}\n`;
        if (page.blocks?.length) {
          for (const block of page.blocks) {
            if (block.content) section += `- ${block.type}: ${block.content}\n`;
          }
        }
        return section;
      }).join('\n');
    }
  },
  {
    key: 'blogs',
    title: 'Blog Posts',
    instruction: `You have access to Magnus's blog posts. Use these to discuss his thoughts, expertise, and insights.`,
    formatData: (blogs: SiteContext['blogs']) => {
      if (!blogs?.length) return '';
      return blogs.map(blog => {
        let section = `\n### ${blog.title}\n`;
        if (blog.excerpt) section += `${blog.excerpt}\n`;
        if (blog.content) section += `${blog.content.substring(0, 500)}...\n`;
        return section;
      }).join('\n');
    }
  }
];

// ============================================
// Dynamic Prompt Builder
// ============================================

function buildDynamicPrompt(basePrompt: string, siteContext: SiteContext | null): string {
  const sections: string[] = [basePrompt || 'You are a helpful AI assistant.'];
  
  if (!siteContext) {
    console.log('[AI] No site context provided - using base prompt only');
    return sections[0];
  }

  const activeSections: string[] = [];
  
  for (const section of contextSections) {
    const data = siteContext[section.key as keyof SiteContext];
    
    if (data && Array.isArray(data) && data.length > 0) {
      const formattedData = section.formatData(data as unknown[]);
      if (formattedData) {
        sections.push(`\n\n## ${section.title}\n${section.instruction}\n${formattedData}`);
        activeSections.push(`${section.key}(${data.length})`);
      }
    }
  }

  console.log(`[AI] Dynamic prompt built: ${activeSections.length} context section(s): [${activeSections.join(', ')}]`);
  console.log(`[AI] Total prompt length: ${sections.join('').length} chars`);

  return sections.join('');
}

// Handler for n8n webhook
async function handleN8n(
  messages: ChatMessage[],
  sessionId: string,
  webhookUrl: string,
  systemPrompt: string,
  siteContext: SiteContext | null
): Promise<{ output: string; artifacts?: unknown[] }> {
  console.log("Calling n8n webhook:", webhookUrl, "with", messages.length, "messages");

  const body: Record<string, unknown> = {
    messages,
    sessionId,
    systemPrompt: buildDynamicPrompt(systemPrompt, siteContext),
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

  let output: string;
  if (Array.isArray(data) && data.length > 0) {
    output = data[0]?.output || data[0]?.message || JSON.stringify(data[0]);
  } else if (data.output) {
    output = data.output;
  } else if (data.message) {
    output = data.message;
  } else if (typeof data === "string") {
    output = data;
  } else {
    output = JSON.stringify(data);
  }

  return { output };
}

// Handler for Lovable AI (with tool calling support)
async function handleLovableAI(
  messages: ChatMessage[],
  model: string,
  systemPrompt: string,
  siteContext: SiteContext | null
): Promise<{ output: string; artifacts?: unknown[] }> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY is not configured");
  }

  console.log("Calling Lovable AI with model:", model);

  // Load resume context for CV Agent capability
  const resumeContext = await loadResumeContext();

  let fullSystemPrompt = buildDynamicPrompt(systemPrompt, siteContext);

  // Add resume context and CV agent instructions if available
  if (resumeContext) {
    fullSystemPrompt += `\n\n## Magnus's Complete Profile (for CV Agent)\n${resumeContext}`;
    fullSystemPrompt += `\n\n## CV Agent Instructions\nYou have a tool called generate_tailored_cv. When a user pastes a job description or asks you to analyze a role for fit, use this tool to:
1. Analyze how well Magnus matches the job requirements
2. Generate a tailored CV highlighting relevant experience
3. Write a professional cover letter for the role
Always be honest about gaps while highlighting strengths. Base everything on Magnus's actual profile data above.`;
  }

  const requestBody: Record<string, unknown> = {
    model: model || "google/gemini-3-flash-preview",
    messages: [
      { role: "system", content: fullSystemPrompt },
      ...messages,
    ],
    stream: false,
  };

  // Add tool calling if resume context is available
  if (resumeContext) {
    requestBody.tools = [cvAgentTool];
    requestBody.tool_choice = "auto";
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
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
  const choice = data.choices?.[0];

  // Check if the model called the CV tool
  if (choice?.message?.tool_calls?.length > 0) {
    const toolCall = choice.message.tool_calls[0];
    if (toolCall.function?.name === "generate_tailored_cv") {
      console.log("[CV Agent] Tool called - parsing structured output");
      try {
        const toolArgs = JSON.parse(toolCall.function.arguments);
        const textResponse = choice.message.content || `Here's my analysis of how Magnus matches this role:`;

        return {
          output: textResponse,
          artifacts: [{
            type: "cv-match",
            title: "CV Match Analysis",
            data: {
              overall_score: toolArgs.overall_score,
              summary: toolArgs.summary,
              match_analysis: toolArgs.match_analysis,
              tailored_cv: toolArgs.tailored_cv,
              cover_letter: toolArgs.cover_letter,
            },
          }],
        };
      } catch (e) {
        console.error("[CV Agent] Failed to parse tool call:", e);
        return { output: choice.message.content || "I tried to analyze the match but encountered an error." };
      }
    }
  }

  return { output: choice?.message?.content || "No response from AI." };
}

// Handler for OpenAI
async function handleOpenAI(
  messages: ChatMessage[],
  model: string,
  systemPrompt: string,
  siteContext: SiteContext | null
): Promise<{ output: string; artifacts?: unknown[] }> {
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured in Supabase secrets");
  }

  console.log("Calling OpenAI with model:", model);

  const fullSystemPrompt = buildDynamicPrompt(systemPrompt, siteContext);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model || "gpt-4o",
      messages: [
        { role: "system", content: fullSystemPrompt },
        ...messages,
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return { output: data.choices?.[0]?.message?.content || "No response from OpenAI." };
}

// Handler for Gemini
async function handleGemini(
  messages: ChatMessage[],
  model: string,
  systemPrompt: string,
  siteContext: SiteContext | null
): Promise<{ output: string; artifacts?: unknown[] }> {
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured in Supabase secrets");
  }

  console.log("Calling Gemini with model:", model);

  const fullSystemPrompt = buildDynamicPrompt(systemPrompt, siteContext);
  const geminiModel = model || "gemini-1.5-flash";

  const contents = [];

  if (fullSystemPrompt) {
    contents.push({
      role: "user",
      parts: [{ text: `[System]: ${fullSystemPrompt}` }],
    });
    contents.push({
      role: "model",
      parts: [{ text: "Understood. I will follow these instructions." }],
    });
  }

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
  return { output: data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini." };
}

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
    } = await req.json();

    console.log("AI Chat request:", {
      integrationType: integration?.type,
      messagesCount: conversationHistory?.length,
      hasSystemPrompt: !!systemPrompt,
      hasContext: !!siteContext,
      contextSummary: siteContext ? {
        repos: siteContext.repos?.length || 0,
        pages: siteContext.pages?.length || 0,
        blogs: siteContext.blogs?.length || 0,
      } : null,
    });

    if (!integration?.type) {
      throw new Error("Integration type is required");
    }

    const messages: ChatMessage[] = conversationHistory || [];
    const customSystemPrompt = systemPrompt || '';

    let result: { output: string; artifacts?: unknown[] };

    switch (integration.type) {
      case "n8n":
        if (!integration.webhook_url) {
          throw new Error("n8n webhook URL is required");
        }
        result = await handleN8n(
          messages,
          sessionId || "default",
          integration.webhook_url,
          customSystemPrompt,
          siteContext
        );
        break;

      case "lovable":
        result = await handleLovableAI(
          messages,
          integration.model || "google/gemini-3-flash-preview",
          customSystemPrompt,
          siteContext
        );
        break;

      case "openai":
        result = await handleOpenAI(
          messages,
          integration.model || "gpt-4o",
          customSystemPrompt,
          siteContext
        );
        break;

      case "gemini":
        result = await handleGemini(
          messages,
          integration.model || "gemini-1.5-flash",
          customSystemPrompt,
          siteContext
        );
        break;

      default:
        throw new Error(`Unsupported integration type: ${integration.type}`);
    }

    console.log("AI response length:", result.output.length, "artifacts:", result.artifacts?.length || 0);

    const responseBody: Record<string, unknown> = { output: result.output };
    if (result.artifacts?.length) {
      responseBody.artifacts = result.artifacts;
    }

    return new Response(
      JSON.stringify(responseBody),
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
