// ============================================
// Agent Autopilot Edge Function
// Autonomous research, blog drafting, newsletter curation
// ============================================

import { createClient } from "npm:@supabase/supabase-js@2";
import { callOpenAICompatible, resolveProvider } from "../_shared/ai-agent.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface AutopilotRequest {
  action: 'research' | 'blog_draft' | 'newsletter_draft' | 'workflows' | 'toggle_workflow' | 'scout' | 'multichannel_draft';
  topic?: string;
  sources?: string[];
  taskId?: string;
  jobName?: string;
  active?: boolean;
  schedule?: string;
  channels?: string[];
}

function getSupabase() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key);
}

// ============================================
// Config Loader
// ============================================

interface AutopilotConfig {
  default_topic: string;
  default_sources: string[];
  enabled: boolean;
}

const DEFAULT_CONFIG: AutopilotConfig = {
  default_topic: 'AI agents, agentic web, digital twins trends',
  default_sources: ['https://news.ycombinator.com'],
  enabled: true,
};

async function loadConfig(supabase: ReturnType<typeof getSupabase>): Promise<AutopilotConfig> {
  const { data } = await supabase
    .from('modules')
    .select('module_config, enabled')
    .eq('module_type', 'autopilot')
    .single();

  if (!data) return DEFAULT_CONFIG;

  const config = data.module_config as Record<string, unknown> || {};
  return {
    default_topic: (config.default_topic as string) || DEFAULT_CONFIG.default_topic,
    default_sources: (config.default_sources as string[]) || DEFAULT_CONFIG.default_sources,
    enabled: data.enabled ?? true,
  };
}

// ============================================
// Firecrawl Research
// ============================================

async function researchTopic(topic: string, sources: string[]): Promise<string> {
  const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!apiKey) throw new Error('Firecrawl not configured');

  const results: string[] = [];

  // Search the web for the topic
  const searchRes = await fetch('https://api.firecrawl.dev/v1/search', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: topic,
      limit: 5,
      scrapeOptions: { formats: ['markdown'] },
    }),
  });

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.data?.length) {
      for (const item of searchData.data.slice(0, 5)) {
        results.push(`## ${item.title || item.url}\nSource: ${item.url}\n${(item.markdown || item.description || '').substring(0, 1500)}`);
      }
    }
  }

  // Scrape specific sources if provided
  for (const source of sources.slice(0, 3)) {
    try {
      const scrapeRes = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: source,
          formats: ['markdown'],
          onlyMainContent: true,
        }),
      });

      if (scrapeRes.ok) {
        const scrapeData = await scrapeRes.json();
        const md = scrapeData.data?.markdown || scrapeData.markdown || '';
        if (md) {
          results.push(`## Source: ${source}\n${md.substring(0, 2000)}`);
        }
      }
    } catch (e) {
      console.error(`[Autopilot] Failed to scrape ${source}:`, e);
    }
  }

  return results.join('\n\n---\n\n') || 'No research results found.';
}

// ============================================
// AI Content Generation
// ============================================

async function generateContent(prompt: string, systemPrompt: string): Promise<string> {
  const config = { provider: 'lovable' as const };
  const { url, apiKey, model } = resolveProvider(config);

  const data = await callOpenAICompatible({
    url,
    apiKey,
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
  });

  return data.choices?.[0]?.message?.content || '';
}

// ============================================
// Action Handlers
// ============================================

async function handleResearch(topic: string, sources: string[], supabase: ReturnType<typeof getSupabase>, taskId?: string) {
  // Create or update task
  const id = taskId || crypto.randomUUID();
  if (!taskId) {
    await supabase.from('agent_tasks').insert({
      id,
      task_type: 'research',
      status: 'running',
      input_data: { topic, sources },
    });
  } else {
    await supabase.from('agent_tasks').update({ status: 'running' }).eq('id', id);
  }

  try {
    const research = await researchTopic(topic, sources);
    
    // AI analysis of research
    const analysis = await generateContent(
      `Research results for "${topic}":\n\n${research}`,
      `You are a research analyst. Analyze these search results and create a structured summary with:
1. Key findings (3-5 bullet points)
2. Trending angles or hot takes
3. How this relates to software development, AI, and digital transformation
4. Suggested blog post angles (2-3 ideas with working titles)

Be concise and actionable.`
    );

    await supabase.from('agent_tasks').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      output_data: { research_summary: analysis, raw_sources: sources, topic },
    }).eq('id', id);

    return { success: true, taskId: id, analysis };
  } catch (e) {
    await supabase.from('agent_tasks').update({
      status: 'failed',
      output_data: { error: e instanceof Error ? e.message : 'Unknown error' },
    }).eq('id', id);
    throw e;
  }
}

async function handleBlogDraft(topic: string, sources: string[], supabase: ReturnType<typeof getSupabase>) {
  const taskId = crypto.randomUUID();
  await supabase.from('agent_tasks').insert({
    id: taskId,
    task_type: 'blog_draft',
    status: 'running',
    input_data: { topic, sources },
  });

  try {
    // Step 1: Research
    const research = await researchTopic(topic, sources);

    // Step 2: Generate blog post
    const blogContent = await generateContent(
      `Write a blog post about: "${topic}"\n\nResearch:\n${research}`,
      `You are a professional tech blogger writing for a personal brand site. Write an engaging, SEO-optimized blog post.

Output format (use these exact headers):
# [Blog Title]

[Full blog content in markdown, 800-1200 words]

---
METADATA:
title: [SEO title, max 60 chars]
excerpt: [Compelling excerpt, max 160 chars]  
seo_description: [Meta description, max 160 chars]
seo_keywords: [comma-separated keywords]

Style: Professional but approachable, with practical insights. Use subheadings, code examples where relevant, and end with a call-to-action or thought-provoking question.`
    );

    // Step 3: Parse and save as draft
    const lines = blogContent.split('\n');
    const titleMatch = lines.find(l => l.startsWith('# '));
    const title = titleMatch?.replace('# ', '').trim() || topic;
    
    // Extract metadata
    const metadataStart = blogContent.indexOf('METADATA:');
    let content = metadataStart > 0 ? blogContent.substring(0, metadataStart).replace(/---\s*$/, '').trim() : blogContent;
    
    let excerpt = '', seoDesc = '', seoTitle = '', seoKeywords: string[] = [];
    if (metadataStart > 0) {
      const meta = blogContent.substring(metadataStart);
      const extractMeta = (key: string) => {
        const match = meta.match(new RegExp(`${key}:\\s*(.+)`));
        return match?.[1]?.trim() || '';
      };
      seoTitle = extractMeta('title');
      excerpt = extractMeta('excerpt');
      seoDesc = extractMeta('seo_description');
      seoKeywords = extractMeta('seo_keywords').split(',').map(k => k.trim()).filter(Boolean);
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const { data: post, error: postError } = await supabase.from('blog_posts').insert({
      title,
      slug: `${slug}-${Date.now()}`,
      content: content.replace(/^# .+\n/, ''), // Remove title from content
      excerpt: excerpt || content.substring(0, 155),
      status: 'draft',
      source: 'agent',
      seo_title: seoTitle || title,
      seo_description: seoDesc || excerpt,
      seo_keywords: seoKeywords.length ? seoKeywords : null,
    }).select('id').single();

    if (postError) throw postError;

    await supabase.from('agent_tasks').update({
      status: 'needs_review',
      completed_at: new Date().toISOString(),
      output_data: { 
        blog_post_id: post.id, 
        title, 
        slug,
        topic,
      },
    }).eq('id', taskId);

    return { success: true, taskId, postId: post.id, title };
  } catch (e) {
    await supabase.from('agent_tasks').update({
      status: 'failed',
      output_data: { error: e instanceof Error ? e.message : 'Unknown error' },
    }).eq('id', taskId);
    throw e;
  }
}

async function handleNewsletterDraft(supabase: ReturnType<typeof getSupabase>) {
  const taskId = crypto.randomUUID();
  await supabase.from('agent_tasks').insert({
    id: taskId,
    task_type: 'newsletter_draft',
    status: 'running',
    input_data: { type: 'weekly_digest' },
  });

  try {
    // Gather recent content
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [blogsRes, tasksRes] = await Promise.all([
      supabase.from('blog_posts').select('title, excerpt, slug').gte('created_at', oneWeekAgo).order('created_at', { ascending: false }).limit(10),
      supabase.from('agent_tasks').select('task_type, output_data').eq('status', 'completed').gte('created_at', oneWeekAgo).limit(10),
    ]);

    const recentBlogs = blogsRes.data || [];
    const recentTasks = tasksRes.data || [];

    const context = [
      '## Recent Blog Posts',
      ...recentBlogs.map(b => `- **${b.title}**: ${b.excerpt || ''}`),
      '',
      '## Recent Research',
      ...recentTasks.filter(t => t.task_type === 'research').map(t => {
        const data = t.output_data as Record<string, string>;
        return `- ${data?.topic || 'Research'}: ${(data?.research_summary || '').substring(0, 200)}`;
      }),
    ].join('\n');

    const newsletter = await generateContent(
      `Create a weekly newsletter digest based on this activity:\n\n${context}`,
      `You are writing a professional weekly newsletter for a tech professional's personal brand.

Format:
Subject: [Compelling subject line]

[Newsletter content in markdown. Include:
- A warm greeting
- Highlights from recent blog posts with links
- Key insights from research
- A personal note or industry observation
- Call to action]

Keep it concise (300-500 words), engaging, and valuable.`
    );

    // Extract subject line
    const subjectMatch = newsletter.match(/Subject:\s*(.+)/);
    const subject = subjectMatch?.[1]?.trim() || `Weekly Digest - ${new Date().toLocaleDateString()}`;
    const content = newsletter.replace(/Subject:\s*.+\n/, '').trim();

    const { data: campaign, error: campaignError } = await supabase.from('newsletter_campaigns').insert({
      subject,
      content,
      status: 'draft',
      agent_notes: 'Auto-generated weekly digest by Autopilot agent',
    }).select('id').single();

    if (campaignError) throw campaignError;

    await supabase.from('agent_tasks').update({
      status: 'needs_review',
      completed_at: new Date().toISOString(),
      output_data: { campaign_id: campaign.id, subject },
    }).eq('id', taskId);

    return { success: true, taskId, campaignId: campaign.id, subject };
  } catch (e) {
    await supabase.from('agent_tasks').update({
      status: 'failed',
      output_data: { error: e instanceof Error ? e.message : 'Unknown error' },
    }).eq('id', taskId);
    throw e;
  }
}

// ============================================
// Scout: Intelligent Source Discovery
// ============================================

async function handleScout(topic: string, supabase: ReturnType<typeof getSupabase>) {
  const taskId = crypto.randomUUID();
  await supabase.from('agent_tasks').insert({
    id: taskId,
    task_type: 'scout',
    status: 'running',
    input_data: { topic },
  });

  try {
    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) throw new Error('Firecrawl not configured');

    // Step 1: AI generates 3 search angles
    const anglesRaw = await generateContent(
      `Topic: "${topic}"`,
      `You are a research strategist. Given a topic, generate exactly 3 diverse web search queries that would find the highest-signal sources. Cover different angles: technical/academic, industry/news, and tools/community.

Return ONLY a JSON array of 3 strings, nothing else. Example:
["AI agent frameworks comparison 2026", "agentic AI enterprise adoption trends", "open source AI agent projects GitHub"]`
    );

    let searchQueries: string[];
    try {
      const cleaned = anglesRaw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      searchQueries = JSON.parse(cleaned);
      if (!Array.isArray(searchQueries)) throw new Error('Not an array');
    } catch {
      searchQueries = [
        `${topic} latest trends 2026`,
        `${topic} tools frameworks`,
        `${topic} expert analysis`,
      ];
    }

    console.log(`[Scout] Search queries:`, searchQueries);

    // Step 2: Parallel Firecrawl searches
    const searchPromises = searchQueries.map(async (query) => {
      try {
        const res = await fetch('https://api.firecrawl.dev/v1/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query, limit: 5 }),
        });
        if (!res.ok) return [];
        const data = await res.json();
        return (data.data || []).map((item: any) => ({
          url: item.url,
          title: item.title || item.url,
          description: item.description || '',
          query,
        }));
      } catch (e) {
        console.error(`[Scout] Search failed for "${query}":`, e);
        return [];
      }
    });

    const allResults = (await Promise.all(searchPromises)).flat();

    // Step 3: Deduplicate by domain
    const seen = new Set<string>();
    const unique = allResults.filter((r: any) => {
      try {
        const domain = new URL(r.url).hostname;
        if (seen.has(domain)) return false;
        seen.add(domain);
        return true;
      } catch { return false; }
    });

    console.log(`[Scout] ${allResults.length} raw results -> ${unique.length} unique domains`);

    // Step 4: AI ranking
    const rankingPrompt = `Rank these sources for the topic "${topic}". Score each 1-10 on relevance, authority, and freshness. Return ONLY a JSON array sorted by score descending.

Sources:
${unique.map((s: any, i: number) => `${i + 1}. ${s.title} - ${s.url}\n   ${s.description}`).join('\n')}

Return format (JSON array only, no markdown):
[{"url":"...","title":"...","score":9,"rationale":"Why this source is valuable"}]

Return top 8 maximum.`;

    const rankingRaw = await generateContent(rankingPrompt, 'You are a source quality analyst. Return only valid JSON.');

    let rankedSources: Array<{ url: string; title: string; score: number; rationale: string }>;
    try {
      const cleaned = rankingRaw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      rankedSources = JSON.parse(cleaned);
      if (!Array.isArray(rankedSources)) throw new Error('Not an array');
    } catch {
      // Fallback: use first 8 unique results without AI ranking
      rankedSources = unique.slice(0, 8).map((s: any) => ({
        url: s.url,
        title: s.title,
        score: 5,
        rationale: 'Auto-discovered',
      }));
    }

    // Step 5: Deep-scrape top 5
    const toScrape = rankedSources.slice(0, 5);
    const scrapePromises = toScrape.map(async (source) => {
      try {
        const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: source.url, formats: ['markdown'], onlyMainContent: true }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        return {
          url: source.url,
          title: source.title,
          markdown: (data.data?.markdown || data.markdown || '').substring(0, 2000),
        };
      } catch {
        return null;
      }
    });

    const scraped = (await Promise.all(scrapePromises)).filter(Boolean);

    // Step 6: AI synthesis
    const synthesisPrompt = `Based on deep-reading these ${scraped.length} sources about "${topic}", provide:

${scraped.map((s: any) => `## ${s.title}\n${s.markdown}`).join('\n\n---\n\n')}

Create a synthesis with:
1. **Key Takeaways** (3-5 bullet points of the most important insights)
2. **Watch List** (domains/publications worth following regularly for this topic)
3. **Content Angles** (2-3 specific blog post ideas based on what's trending)

Be concise and actionable.`;

    const synthesis = await generateContent(synthesisPrompt, 'You are a research analyst creating an intelligence brief.');

    // Extract watch list domains
    const watchList = rankedSources.slice(0, 5).map((s) => {
      try { return new URL(s.url).hostname; } catch { return s.url; }
    });

    // Save results
    await supabase.from('agent_tasks').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      output_data: {
        topic,
        sources: rankedSources,
        synthesis,
        watch_list: watchList,
        search_queries: searchQueries,
        scraped_count: scraped.length,
      },
    }).eq('id', taskId);

    return { success: true, taskId, sources: rankedSources, synthesis };
  } catch (e) {
    await supabase.from('agent_tasks').update({
      status: 'failed',
      output_data: { error: e instanceof Error ? e.message : 'Unknown error' },
    }).eq('id', taskId);
    throw e;
  }
}

// ============================================
// Workflow Handlers
// ============================================

async function handleWorkflows(supabase: ReturnType<typeof getSupabase>) {
  // Get cron jobs - wrap in try/catch since rpc doesn't have .catch()
  let cronJobs = null;
  try {
    const res = await supabase.rpc('get_cron_jobs');
    cronJobs = res.data;
  } catch {
    cronJobs = null;
  }

  // Get module configs
  const { data: modules } = await supabase
    .from('modules')
    .select('module_type, module_config, enabled')
    .in('module_type', ['autopilot', 'gmail_signals']);

  // Get latest task per type
  const { data: latestTasks } = await supabase
    .from('agent_tasks')
    .select('task_type, status, created_at, completed_at')
    .order('created_at', { ascending: false })
    .limit(20);

  // Group latest task by type
  const lastRun: Record<string, { status: string; created_at: string; completed_at: string | null }> = {};
  for (const t of latestTasks || []) {
    if (!lastRun[t.task_type]) {
      lastRun[t.task_type] = t;
    }
  }

  return {
    success: true,
    cronJobs: cronJobs || [],
    modules: (modules || []).reduce((acc: Record<string, unknown>, m) => {
      acc[m.module_type] = { config: m.module_config, enabled: m.enabled };
      return acc;
    }, {}),
    lastRun,
  };
}

async function handleToggleWorkflow(
  supabase: ReturnType<typeof getSupabase>,
  jobName: string,
  active: boolean,
  schedule?: string
) {
  // Use cron.alter_job to toggle or update schedule
  if (schedule) {
    await supabase.rpc('alter_cron_job', { job_name: jobName, new_schedule: schedule, new_active: active });
  } else {
    await supabase.rpc('alter_cron_job', { job_name: jobName, new_schedule: null, new_active: active });
  }

  return { success: true, jobName, active, schedule };
}

// ============================================
// Main Handler
// ============================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json() as AutopilotRequest;
    const { action, topic, sources, taskId, jobName, active, schedule } = body;
    const supabase = getSupabase();

    // Load config for defaults
    const config = await loadConfig(supabase);

    // Use provided values or fall back to config defaults
    const effectiveTopic = topic || config.default_topic;
    const effectiveSources = sources?.length ? sources : config.default_sources;

    console.log(`[Autopilot] Action: ${action}, Topic: ${effectiveTopic}`);

    let result;

    switch (action) {
      case 'workflows':
        result = await handleWorkflows(supabase);
        break;

      case 'toggle_workflow':
        if (!jobName) throw new Error('jobName required for toggle_workflow');
        result = await handleToggleWorkflow(supabase, jobName, active ?? true, schedule);
        break;

      case 'research':
        result = await handleResearch(effectiveTopic, effectiveSources, supabase, taskId);
        break;

      case 'blog_draft':
        result = await handleBlogDraft(effectiveTopic, effectiveSources, supabase);
        break;

      case 'newsletter_draft':
        result = await handleNewsletterDraft(supabase);
        break;

      case 'scout':
        if (!effectiveTopic) throw new Error('Topic required for scout');
        result = await handleScout(effectiveTopic, supabase);
        break;

      case 'multichannel_draft':
        result = await handleMultichannelDraft(effectiveTopic, effectiveSources, supabase, body.channels);
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Autopilot] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
