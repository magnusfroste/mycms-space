import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

## Guidelines

1. **Be conversational**: Chat naturally with the user about their needs.
2. **Suggest designs**: Based on their industry/goals, recommend block combinations.
3. **Fill with content**: Generate relevant placeholder content that matches their brand.
4. **Be creative**: Use modern 2026 blocks (bento-grid, stats-counter, testimonials) for impressive designs.
5. **Keep it simple**: Don't overwhelm - suggest 3-5 blocks for a good landing page.

## Example Flows

User: "I need a portfolio for a photographer"
→ Suggest: video-hero (with nature video), bento-grid (services), testimonial-carousel, cta-banner

User: "Create a SaaS landing page"  
→ Suggest: hero, stats-counter (users, uptime, etc.), bento-grid (features), testimonial-carousel, cta-banner

When the user confirms, output the JSON to create the block. Always provide helpful, encouraging responses.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, currentBlocks } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Add context about current page state
    const contextMessage = currentBlocks?.length 
      ? `\n\nCurrent page has ${currentBlocks.length} blocks: ${currentBlocks.map((b: any) => b.block_type).join(", ")}`
      : "\n\nThe page is currently empty - this is a fresh start!";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + contextMessage },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
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
