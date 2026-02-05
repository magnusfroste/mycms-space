import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

type EnhanceAction = 'enhance-prompt' | 'expand-prompt' | 'structure-prompt';

interface EnhanceRequest {
  text: string;
  action: EnhanceAction;
}

const getSystemPrompt = (action: EnhanceAction): string => {
  const baseContext = `You are an expert at crafting AI system prompts for chatbots and virtual assistants. Your task is to improve the user's system prompt to make it more effective.`;
  
  switch (action) {
    case 'enhance-prompt':
      return `${baseContext}

Your task is to IMPROVE the provided system prompt:
- Make instructions clearer and more specific
- Improve the language and tone
- Remove redundancy
- Keep the same length approximately
- Preserve the original intent and personality

Return ONLY the improved prompt text, no explanations or meta-commentary.`;
    
    case 'expand-prompt':
      return `${baseContext}

Your task is to EXPAND the provided system prompt with more detail:
- Add specific examples of desired behavior
- Include edge case handling
- Add personality traits and conversational style details
- Include formatting guidelines if appropriate
- Make it 2-3x longer while staying focused

Return ONLY the expanded prompt text, no explanations or meta-commentary.`;
    
    case 'structure-prompt':
      return `${baseContext}

Your task is to STRUCTURE the provided system prompt with clear organization:
- Use markdown headings (# Role, ## Personality, ## Instructions, etc.)
- Organize into logical sections
- Use bullet points for lists
- Add clear separation between different aspects
- Keep all original content but reorganize it

Return ONLY the structured prompt text, no explanations or meta-commentary.`;
    
    default:
      return baseContext;
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { text, action }: EnhanceRequest = await req.json();

    if (!text?.trim()) {
      return new Response(
        JSON.stringify({ error: 'No prompt text provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['enhance-prompt', 'expand-prompt', 'structure-prompt'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${action} request`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: getSystemPrompt(action) },
          { role: "user", content: text },
        ],
        temperature: 0.7,
        max_tokens: action === 'expand-prompt' ? 3000 : 2000,
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
    console.error('enhance-prompt error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
