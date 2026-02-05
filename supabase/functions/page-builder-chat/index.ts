import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  getAICompletion, 
  getAIModuleConfig,
  handleProviderError,
  type AIMessage,
  type AIProviderConfig
} from "../_shared/ai-provider.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Block type definitions for AI context
const BLOCK_DEFINITIONS = `
## Available Block Types

You can create and configure these block types:

### 1. hero
Full-width hero section with name, tagline, features, and animations.
Config: { name, tagline, features: [{text, icon}], enable_animations, animation_style: "falling-stars"|"particles"|"gradient-shift" }

### 2. video-hero ✨
Full-screen video background with overlay text and CTA.
Config: { video_url, headline, subheadline, cta_text, cta_url, text_alignment: "left"|"center"|"right", overlay_opacity: 0-1, show_controls }

### 3. about-split
Split layout with image and text content.
Config: { title, subtitle, name, intro_text, additional_text, image_url, skills: [{title, description, icon}] }

### 4. text-section
Simple text block for content.
Config: { title, content, alignment: "left"|"center"|"right" }

### 5. cta-banner
Call-to-action banner with button.
Config: { title, description, button_text, button_url }

### 6. image-text
Image with accompanying text.
Config: { title, content, image_url, image_position: "left"|"right" }

### 7. expertise-grid
Grid of expertise/skills cards.
Config: { title, subtitle } - Items managed separately in expertise_areas table.

### 8. featured-carousel
Carousel of featured items/logos.
Config: { title, subtitle } - Items managed separately in featured_in table.

### 9. project-showcase
Portfolio project showcase with filtering.
Config: { title, subtitle } - Projects managed separately in projects table.

### 10. chat-widget
AI chat widget for visitor interaction.
Config: { title, subtitle }

### 11. bento-grid ✨
Modern asymmetric grid layout (Apple/Linear style).
Config: { headline, subheadline, items: [{ id, title, description, icon, size: "small"|"medium"|"large", gradient }] }
Icons: sparkles, zap, shield, palette, code, rocket, star, heart, globe, layers
Gradients: from-purple-500/20 to-pink-500/20, from-blue-500/20 to-cyan-500/20, etc.

### 12. stats-counter ✨
Animated statistics with counting animation.
Config: { headline, subheadline, layout: "grid"|"inline", animate: true/false, stats: [{ id, value, prefix, suffix, label, description }] }

### 13. testimonial-carousel ✨
3D carousel with testimonials.
Config: { headline, subheadline, autoplay, autoplay_interval, testimonials: [{ id, quote, author, role, company, avatar_url, rating: 1-5 }] }

### 14. parallax-section ✨
Multi-layered scroll parallax effect.
Config: { headline, description, background_image, height: "medium"|"large"|"full", parallax_speed: 0-1, text_color: "light"|"dark" }

### 15. marquee ✨
Infinite scrolling text/logo ticker.
Config: { headline, speed: "slow"|"medium"|"fast", direction: "left"|"right", pause_on_hover, show_gradient }

### 16. spacer
Simple vertical spacing.
Config: { height: "sm"|"md"|"lg"|"xl" }

## Response Format

When creating blocks, respond with JSON in this format:
\`\`\`json
{
  "action": "create_block" | "update_block" | "suggest",
  "block_type": "one of the types above",
  "config": { ... block configuration ... },
  "message": "Brief explanation to user"
}
\`\`\`

For suggestions without creating, use action: "suggest" and provide recommendations in message.
`;

const SYSTEM_PROMPT = `You are an AI page builder assistant. You help users create beautiful, modern landing pages by suggesting and configuring content blocks.

${BLOCK_DEFINITIONS}

## Tools Available

You have access to these tools:

1. **scrape_website** - Fetch content from any URL to analyze and use for creating projects or content
2. **add_project** - Add a new project to the portfolio with auto-generated content

When a user asks you to fetch info from a website and create a project, use these tools!

## Guidelines

1. **Take action immediately**: When a user asks you to create a page or blocks, CREATE ALL THE BLOCKS in a single response. Do NOT ask for confirmation between blocks.
2. **Fill with content**: Generate relevant, high-quality placeholder content that matches their brand/industry.
3. **Be creative**: Use modern 2026 blocks (bento-grid, stats-counter, testimonials) for impressive designs.
4. **Keep it simple**: Create 3-5 blocks for a complete landing page.
5. **Output multiple blocks**: You can output MULTIPLE JSON blocks in one response. Just include multiple \`\`\`json code blocks.
6. **Use tools for websites**: When asked to fetch info from a website, ALWAYS use the scrape_website tool first.
7. **Create projects from scraped data**: After scraping, use add_project to create a project with the extracted info.

## CRITICAL: Multi-Block Creation

When asked to create a page (e.g., "Create a SaaS landing page"), output ALL blocks in ONE response like this:

Brief intro message, then:

\`\`\`json
{ "action": "create_block", "block_type": "hero", "config": {...}, "message": "Hero created" }
\`\`\`

\`\`\`json
{ "action": "create_block", "block_type": "stats-counter", "config": {...}, "message": "Stats created" }
\`\`\`

\`\`\`json
{ "action": "create_block", "block_type": "bento-grid", "config": {...}, "message": "Bento grid created" }
\`\`\`

Brief closing message.

## Project Creation Format

When creating projects, use this format:
\`\`\`json
{
  "action": "add_project",
  "project": {
    "title": "Project Name",
    "description": "A compelling description of what the project does",
    "problem_statement": "The problem this project solves",
    "why_built": "Why you created this project",
    "demo_link": "https://example.com"
  },
  "message": "Project added!"
}
\`\`\`

NEVER ask "Ska vi gå vidare?" or "Vill du att jag skapar nästa block?". Just CREATE all blocks immediately.`;

// Tool definitions for function calling
const TOOLS = [
  {
    type: "function",
    function: {
      name: "scrape_website",
      description: "Fetch and analyze content from a website URL. Returns markdown content, metadata, and links.",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "The URL of the website to scrape"
          }
        },
        required: ["url"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_project",
      description: "Add a new project to the portfolio database",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Project title"
          },
          description: {
            type: "string",
            description: "Project description"
          },
          problem_statement: {
            type: "string",
            description: "The problem this project solves"
          },
          why_built: {
            type: "string",
            description: "Why the project was created"
          },
          demo_link: {
            type: "string",
            description: "URL to the project demo"
          }
        },
        required: ["title", "description"],
        additionalProperties: false
      }
    }
  }
];

// Execute tool calls
async function executeTool(name: string, args: Record<string, unknown>, supabaseUrl: string, supabaseKey: string): Promise<string> {
  console.log(`Executing tool: ${name}`, args);
  
  if (name === "scrape_website") {
    const url = args.url as string;
    console.log(`Scraping website: ${url}`);
    
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/firecrawl-scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ url, options: { formats: ['markdown'] } }),
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        console.error('Scrape failed:', data);
        return JSON.stringify({ error: data.error || 'Failed to scrape website' });
      }
      
      const markdown = data.data?.markdown || data.markdown || '';
      const metadata = data.data?.metadata || data.metadata || {};
      
      console.log('Scrape successful, content length:', markdown.length);
      
      return JSON.stringify({
        success: true,
        title: metadata.title || '',
        description: metadata.description || '',
        url: url,
        content: markdown.substring(0, 5000),
      });
    } catch (error) {
      console.error('Scrape error:', error);
      return JSON.stringify({ error: `Failed to scrape: ${error}` });
    }
  }
  
  if (name === "add_project") {
    console.log('Adding project to database');
    
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data: existingProjects } = await supabase
        .from('projects')
        .select('order_index')
        .order('order_index', { ascending: false })
        .limit(1);
      
      const maxOrder = existingProjects?.[0]?.order_index ?? -1;
      
      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          title: args.title as string,
          description: args.description as string,
          problem_statement: args.problem_statement as string || null,
          why_built: args.why_built as string || null,
          demo_link: args.demo_link as string || '#',
          order_index: maxOrder + 1,
          enabled: true,
        })
        .select()
        .single();
      
      if (error) {
        console.error('Insert error:', error);
        return JSON.stringify({ error: `Failed to add project: ${error.message}` });
      }
      
      console.log('Project added:', project.id);
      return JSON.stringify({ success: true, project_id: project.id, title: project.title });
    } catch (error) {
      console.error('Add project error:', error);
      return JSON.stringify({ error: `Failed to add project: ${error}` });
    }
  }
  
  return JSON.stringify({ error: `Unknown tool: ${name}` });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, currentBlocks } = await req.json();
    
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration missing");
    }

    // Get AI module config once for all requests
    const aiConfig = await getAIModuleConfig();

    // Add context about current page state
    const contextMessage = currentBlocks?.length 
      ? `\n\nCurrent page has ${currentBlocks.length} blocks: ${currentBlocks.map((b: { block_type: string }) => b.block_type).join(", ")}`
      : "\n\nThe page is currently empty - this is a fresh start!";

    const initialMessages: AIMessage[] = [
      { role: "system", content: SYSTEM_PROMPT + contextMessage },
      ...messages,
    ];

    // Initial request with tools
    const result = await getAICompletion({
      messages: initialMessages,
      tools: TOOLS,
      stream: false,
    }, aiConfig);

    // Handle provider errors
    const providerError = handleProviderError(result, corsHeaders);
    if (providerError) return providerError;

    if (!result.response!.ok) {
      const status = result.response!.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await result.response!.text();
      console.error("AI provider error:", status, t);
      return new Response(JSON.stringify({ error: "AI provider error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let data = await result.response!.json();
    let assistantMessage = data.choices?.[0]?.message;
    
    // Handle tool calls in a loop
    const conversationMessages: AIMessage[] = [
      { role: "system", content: SYSTEM_PROMPT + contextMessage },
      ...messages,
    ];
    
    let iterations = 0;
    const maxIterations = 5;
    
    while (assistantMessage?.tool_calls && iterations < maxIterations) {
      iterations++;
      console.log(`Processing tool calls, iteration ${iterations}`);
      
      conversationMessages.push(assistantMessage);
      
      // Execute each tool call
      for (const toolCall of assistantMessage.tool_calls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);
        
        const toolResult = await executeTool(toolName, toolArgs, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        conversationMessages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: toolResult,
        });
      }
      
      // Continue conversation with tool results
      const continueResult = await getAICompletion({
        messages: conversationMessages,
        tools: TOOLS,
        stream: false,
      }, aiConfig);
      
      if (continueResult.error || !continueResult.response?.ok) {
        console.error("AI provider error in tool loop");
        break;
      }
      
      data = await continueResult.response.json();
      assistantMessage = data.choices?.[0]?.message;
    }
    
    // Final response - stream the last message
    const finalContent = assistantMessage?.content || "Jag kunde inte slutföra uppgiften.";
    
    // Convert to SSE format for consistent frontend handling
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const sseData = JSON.stringify({
          choices: [{ delta: { content: finalContent } }]
        });
        controller.enqueue(encoder.encode(`data: ${sseData}\n\n`));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("page-builder-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
