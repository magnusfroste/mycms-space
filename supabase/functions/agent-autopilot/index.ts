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
  action: 'research' | 'blog_draft' | 'newsletter_draft' | 'workflows' | 'toggle_workflow' | 'scout';
  topic?: string;
  sources?: string[];
  taskId?: string;
  jobName?: string;
  active?: boolean;
  schedule?: string;
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
