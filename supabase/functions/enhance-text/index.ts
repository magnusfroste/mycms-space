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

type EnhanceAction = 'correct' | 'enhance' | 'expand' | 'summarize' | 'simplify' | 'tone-professional' | 'tone-casual' | 'tone-technical' | 'generate-outline' | 'generate-intro' | 'generate-conclusion' | 'generate-draft';

interface EnhanceRequest {
  text: string;
  action: EnhanceAction;
  context?: string;
  title?: string;
}

const validActions: EnhanceAction[] = ['correct', 'enhance', 'expand', 'summarize', 'simplify', 'tone-professional', 'tone-casual', 'tone-technical', 'generate-outline', 'generate-intro', 'generate-conclusion', 'generate-draft'];

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
    
    case 'summarize':
      return `You are a professional editor. Your task is to condense the provided text to roughly half its length or less while preserving all key points and meaning. Remove redundancy, tighten sentences, and keep only what's essential. Return ONLY the summarized text without any explanations.${contextInfo}`;
    
    case 'simplify':
      return `You are a plain-language expert. Your task is to rewrite the provided text using simple, accessible language. Remove jargon, shorten sentences, and make it easy for a general audience to understand. Keep the same meaning and approximately the same length. Return ONLY the simplified text without any explanations.${contextInfo}`;
    
    case 'tone-professional':
      return `You are a professional copywriter. Rewrite the provided text in a formal, business-appropriate tone. Use confident, authoritative language suitable for corporate communication. Keep the same meaning and approximately the same length. Return ONLY the rewritten text without any explanations.${contextInfo}`;
    
    case 'tone-casual':
      return `You are a friendly writer. Rewrite the provided text in a warm, conversational tone. Use approachable language as if talking to a friend while keeping it informative. Keep the same meaning and approximately the same length. Return ONLY the rewritten text without any explanations.${contextInfo}`;
    
    case 'tone-technical':
      return `You are a technical writer. Rewrite the provided text in a precise, technical tone. Use accurate terminology, specific details, and a structured approach suitable for a developer or engineering audience. Keep the same meaning and approximately the same length. Return ONLY the rewritten text without any explanations.${contextInfo}`;
    
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
    
    case 'generate-draft':
      return `You are a professional blog writer. Write a complete, well-structured blog post in Markdown format. The post should include:

1. **Engaging Introduction** (2-3 paragraphs) - Hook the reader and preview what they'll learn
2. **Main Content** (3-5 sections with ## headings) - Cover the topic thoroughly with practical insights
3. **Subpoints and Examples** - Use bullet points, numbered lists, and concrete examples
4. **Conclusion** - Summarize key takeaways and include a call to action

Guidelines:
- Use proper Markdown formatting (##, ###, **, -, etc.)
- Write in a professional but approachable tone
- Make it informative and actionable
- Target length: 800-1200 words
- Include relevant subheadings for scannability

${titleInfo}${contextInfo}

Return ONLY the complete blog post in Markdown format, no meta-commentary.`;
    
    default:
      return 'You are a helpful assistant.';
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text, action, context, title }: EnhanceRequest = await req.json();

    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    const isSummarize = action === 'summarize';
    const userMessage = isGenerateAction 
      ? (text || title || 'Generate content')
      : text;

    const messages: AIMessage[] = [
      { role: "system", content: getSystemPrompt(action, context, title) },
      { role: "user", content: userMessage },
    ];

    const result = await getAdminAICompletion({
      messages,
      temperature: action === 'correct' ? 0.1 : 0.7,
      max_tokens: isGenerateAction ? (action === 'generate-draft' ? 4000 : 2000) : (action === 'expand' ? 2000 : (isSummarize ? 500 : 1000)),
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
    console.error('enhance-text error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
