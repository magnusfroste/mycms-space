import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

type EnhanceAction = 'correct' | 'enhance' | 'expand' | 'generate-outline' | 'generate-intro' | 'generate-conclusion';

interface EnhanceRequest {
  text: string;
  action: EnhanceAction;
  context?: string;
  title?: string; // For blog generation actions
}

const validActions: EnhanceAction[] = ['correct', 'enhance', 'expand', 'generate-outline', 'generate-intro', 'generate-conclusion'];

const getSystemPrompt = (action: EnhanceAction, context?: string, title?: string): string => {
  const contextInfo = context ? `\n\nContext: This is ${context}.` : '';
  const titleInfo = title ? `\n\nBlog post title: "${title}"` : '';
  
  switch (action) {
    case 'correct':
      return `You are a helpful writing assistant. Your task is to correct spelling, grammar, and punctuation errors in the provided text. Keep the same tone and meaning, only fix errors. Return ONLY the corrected text without any explanations or additional commentary.${contextInfo}`;
    
    case 'enhance':
      return `You are a professional copywriter. Your task is to improve the provided text to make it more engaging, professional, and impactful. Maintain the core message but improve word choice, flow, and clarity. Keep approximately the same length. Return ONLY the enhanced text without any explanations or additional commentary.${contextInfo}`;
    
    case 'expand':
      return `You are a professional copywriter. Your task is to expand the provided text with more details, examples, or elaboration. Make it roughly 2-3 times longer while maintaining the same professional tone. Return ONLY the expanded text without any explanations or additional commentary.${contextInfo}`;
    
    case 'generate-outline':
      return `You are a professional blog writer. Generate a well-structured outline for a blog post in Markdown format. Include:
- A compelling introduction section
- 3-5 main sections with subpoints
- A conclusion section

Use proper Markdown headings (##, ###) and bullet points. Make it practical and actionable.${titleInfo}${contextInfo}

Return ONLY the outline in Markdown format, no explanations.`;
    
    case 'generate-intro':
      return `You are a professional blog writer. Write an engaging introduction paragraph for a blog post. The introduction should:
- Hook the reader with an interesting opening
- Briefly explain what the post will cover
- Be 2-3 paragraphs in Markdown format
- Use a professional but approachable tone

${titleInfo}${contextInfo}

Return ONLY the introduction text in Markdown, no explanations.`;
    
    case 'generate-conclusion':
      return `You are a professional blog writer. Write a strong conclusion for a blog post. The conclusion should:
- Summarize the key points
- Include a call to action or next steps
- Be 1-2 paragraphs in Markdown format
- Leave the reader with something to think about

${titleInfo}${contextInfo}

Return ONLY the conclusion text in Markdown, no explanations.`;
    
    default:
      return 'You are a helpful assistant.';
  }
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { text, action, context, title }: EnhanceRequest = await req.json();

    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For generate actions, text can be empty but we need title
    const isGenerateAction = action.startsWith('generate-');
    if (!isGenerateAction && !text) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: text' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!validActions.includes(action)) {
      return new Response(
        JSON.stringify({ error: `Invalid action. Must be one of: ${validActions.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${action} request${title ? ` for title: "${title}"` : ''}`);

    // For generate actions, use title as the user message if no text
    const userMessage = isGenerateAction 
      ? (text || title || 'Generate content for a blog post')
      : text;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: getSystemPrompt(action, context, title) },
          { role: "user", content: userMessage },
        ],
        temperature: action === 'correct' ? 0.1 : 0.7,
        max_tokens: isGenerateAction ? 2000 : (action === 'expand' ? 2000 : 1000),
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const errorText = await response.text();
      console.error(`AI gateway error: ${status}`, errorText);

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

    const data = await response.json();
    const enhancedText = data.choices?.[0]?.message?.content?.trim();

    if (!enhancedText) {
      return new Response(
        JSON.stringify({ error: 'No response from AI service' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully processed ${action} request`);

    return new Response(
      JSON.stringify({ text: enhancedText, action }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('enhance-text error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});