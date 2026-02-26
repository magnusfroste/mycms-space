// ============================================
// Enrich GitHub Repo Edge Function
// Uses AI + optional Firecrawl to generate
// title, description, problem statement, why it matters
// ============================================

import { getAdminAICompletion, handleProviderError, handleResponseErrors } from "../_shared/ai-provider.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function scrapeHomepage(url: string): Promise<string | null> {
  const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!apiKey || !url) return null;

  try {
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log('Scraping homepage for enrichment:', formattedUrl);

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ['markdown'],
        onlyMainContent: true,
        maxAge: 0,
      }),
    });

    if (!response.ok) {
      console.warn('Homepage scrape failed:', response.status);
      return null;
    }

    const data = await response.json();
    const markdown = data?.data?.markdown || data?.markdown || '';
    // Truncate to avoid token limits
    return markdown.slice(0, 4000) || null;
  } catch (e) {
    console.warn('Homepage scrape error:', e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, description, language, topics, stars, readme, homepage } = await req.json();

    if (!name) {
      return new Response(
        JSON.stringify({ error: 'Repository name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Optionally scrape homepage
    let homepageContent: string | null = null;
    if (homepage) {
      homepageContent = await scrapeHomepage(homepage);
    }

    // Build context
    const contextParts: string[] = [];
    contextParts.push(`Repository: ${name}`);
    if (description) contextParts.push(`GitHub Description: ${description}`);
    if (language) contextParts.push(`Primary Language: ${language}`);
    if (topics?.length) contextParts.push(`Topics: ${topics.join(', ')}`);
    if (stars != null) contextParts.push(`Stars: ${stars}`);
    if (readme) contextParts.push(`\n--- README.md ---\n${readme.slice(0, 6000)}`);
    if (homepageContent) contextParts.push(`\n--- Homepage Content ---\n${homepageContent}`);

    const systemPrompt = `You are an expert at writing compelling, concise project descriptions for a developer portfolio.

Given repository data, generate exactly this JSON (no markdown, no code fences):
{
  "title": "A polished, human-friendly project name (not the repo slug)",
  "description": "A compelling 2-4 sentence summary of what the project does and who it's for. Use markdown for emphasis where appropriate.",
  "problemStatement": "1-3 sentences explaining the problem this project solves. Use markdown.",
  "whyItMatters": "1-3 sentences on the impact, relevance, or unique value. Use markdown."
}

Rules:
- Write in English
- Be specific and concrete, not generic
- Avoid buzzwords and filler
- If the repo is a library/tool, focus on developer experience
- If the repo is an app, focus on user value
- Return ONLY valid JSON, nothing else`;

    const result = await getAdminAICompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: contextParts.join('\n') },
      ],
      temperature: 0.6,
      max_tokens: 1000,
    });

    // Handle provider errors
    const providerError = handleProviderError(result, corsHeaders);
    if (providerError) return providerError;

    const responseError = await handleResponseErrors(result.response!, corsHeaders);
    if (responseError) return responseError;

    const aiData = await result.response!.json();
    const content = aiData.choices?.[0]?.message?.content || '';

    // Parse JSON from response (strip possible code fences)
    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let enriched;
    try {
      enriched = JSON.parse(jsonStr);
    } catch {
      console.error('Failed to parse AI response as JSON:', content);
      return new Response(
        JSON.stringify({ error: 'AI returned invalid format. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Enrichment generated for:', name);
    return new Response(
      JSON.stringify({
        success: true,
        title: enriched.title || '',
        description: enriched.description || '',
        problemStatement: enriched.problemStatement || '',
        whyItMatters: enriched.whyItMatters || '',
        hadHomepage: !!homepageContent,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Enrich error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to enrich' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
