// Enhance prompt edge function - v2
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  getAdminAICompletion, 
  handleProviderError, 
  handleResponseErrors,
  type AIMessage 
} from "../_shared/ai-provider.ts";

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

    const messages: AIMessage[] = [
      { role: "system", content: getSystemPrompt(action) },
      { role: "user", content: text },
    ];

    // Use admin AI provider (separate from chat)
    const result = await getAdminAICompletion({
      messages,
      temperature: 0.7,
      max_tokens: action === 'expand-prompt' ? 3000 : 2000,
    });

    // Handle provider configuration errors
    const providerError = handleProviderError(result, corsHeaders);
    if (providerError) return providerError;

    // Handle API response errors
    const responseError = await handleResponseErrors(result.response!, corsHeaders);
    if (responseError) return responseError;

    const data = await result.response!.json();
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
