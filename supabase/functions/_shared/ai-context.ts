// ============================================
// AI Context Module
// Resume loading, site context, memory, prompt building
// ============================================

import { createClient } from "npm:@supabase/supabase-js@2";

// ============================================
// Types
// ============================================

export interface VisitorInsightsData {
  visitCount: number;
  isReturning: boolean;
  firstVisit: string;
  lastVisit: string;
  pagesVisited: string[];
  currentSession: string[];
  topPages: string[];
  daysSinceLastVisit: number | null;
}

export interface SiteContext {
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
  visitorInsights?: VisitorInsightsData;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AgentMemoryEntry {
  id: string;
  category: string;
  key: string;
  content: string;
  metadata: Record<string, unknown>;
  updated_at: string;
}

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
// Agent Memory Loader
// ============================================

function getSupabaseClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;
  return createClient(url, key);
}

/** Load all agent memory entries */
export async function loadAgentMemory(): Promise<AgentMemoryEntry[]> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('agent_memory')
      .select('*')
      .order('category')
      .order('key');

    if (error) {
      console.error('[AI Context] Failed to load agent memory:', error);
      return [];
    }

    console.log(`[AI Context] Loaded ${data?.length || 0} memory entries`);
    return (data || []) as AgentMemoryEntry[];
  } catch (e) {
    console.error('[AI Context] Memory load error:', e);
    return [];
  }
}

/** Format memory entries into system prompt sections */
export function formatMemoryForPrompt(memories: AgentMemoryEntry[]): string {
  if (!memories.length) return '';

  const sections: string[] = [];

  // SOUL entries — identity, tone, values
  const soulEntries = memories.filter(m => m.category === 'soul');
  if (soulEntries.length) {
    sections.push('\n\n## Soul & Identity');
    for (const entry of soulEntries) {
      sections.push(`**${entry.key}:** ${entry.content}`);
    }
  }

  // Facts — platform knowledge, learned facts
  const factEntries = memories.filter(m => m.category === 'fact');
  if (factEntries.length) {
    sections.push('\n\n## Known Facts');
    for (const entry of factEntries) {
      sections.push(`- **${entry.key}:** ${entry.content}`);
    }
  }

  // Learnings — self-improvement insights
  const lessonEntries = memories.filter(m => m.category === 'lesson');
  if (lessonEntries.length) {
    sections.push('\n\n## Learnings');
    for (const entry of lessonEntries) {
      sections.push(`- ${entry.key}: ${entry.content}`);
    }
  }

  // Skill instructions — rich knowledge per tool
  const skillEntries = memories.filter(m => m.category === 'skill_instruction');
  if (skillEntries.length) {
    sections.push('\n\n## Skill Knowledge');
    for (const entry of skillEntries) {
      sections.push(`### ${entry.key}\n${entry.content}`);
    }
  }

  return sections.join('\n');
}

/** Save or update a memory entry */
export async function upsertMemory(category: string, key: string, content: string, metadata?: Record<string, unknown>): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    const { error } = await supabase
      .from('agent_memory')
      .upsert(
        { category, key, content, metadata: metadata || {}, updated_at: new Date().toISOString() },
        { onConflict: 'category,key' }
      );

    if (error) {
      console.error('[AI Context] Failed to save memory:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[AI Context] Memory save error:', e);
    return false;
  }
}

// ============================================
// Prompt Builder
// ============================================

/** Build a dynamic system prompt with site context sections */
export function buildDynamicPrompt(basePrompt: string, siteContext: SiteContext | null): string {
  const sections: string[] = [basePrompt || 'You are a helpful AI assistant.'];

  if (!siteContext) {
    console.log('[AI Context] No site context provided');
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

  // Visitor insights section
  if (siteContext.visitorInsights) {
    const vi = siteContext.visitorInsights;
    const parts: string[] = [];
    parts.push(`- Visit count: ${vi.visitCount}`);
    parts.push(`- Returning visitor: ${vi.isReturning ? 'yes' : 'no (first visit)'}`);
    if (vi.isReturning && vi.daysSinceLastVisit !== null) {
      parts.push(`- Days since last visit: ${vi.daysSinceLastVisit}`);
    }
    if (vi.pagesVisited?.length) {
      parts.push(`- Pages previously visited: ${vi.pagesVisited.join(', ')}`);
    }
    if (vi.currentSession?.length) {
      parts.push(`- Pages visited this session: ${vi.currentSession.join(', ')}`);
    }
    if (vi.topPages?.length) {
      parts.push(`- Most visited pages: ${vi.topPages.join(', ')}`);
    }

    sections.push(`\n\n## Visitor Insights\nYou have access to this visitor's browsing behavior. Use this to personalize your greeting and conversation. For returning visitors, acknowledge them warmly and reference their interests based on pages they've visited. For first-time visitors, give a welcoming introduction. During testing/POC, you may confirm what pages the visitor has been to when asked.\n${parts.join('\n')}`);
    activeSections.push('visitor');
  }

  console.log(`[AI Context] Prompt built: ${activeSections.length} section(s): [${activeSections.join(', ')}]`);
  return sections.join('');
}

/** Build admin CMS co-pilot prompt */
export function buildAdminPrompt(basePrompt: string, siteContext: SiteContext | null): string {
  const adminPersona = `# Role
You are Magnet in CMS co-pilot mode — Magnus's autonomous content management agent.

# Behavior
- Proactively suggest actions: research, drafts, publishing
- When you complete a task, immediately suggest the next logical step
- Use a concise, action-oriented tone — this is a work session
- Present review items clearly with approve/edit/reject options
- Keep responses short and actionable
- When you learn something new or discover an insight, use save_memory to persist it

# Capabilities
You can research topics, draft blog posts, create multichannel content (blog + LinkedIn + X), 
check the review queue, approve pending tasks, show site analytics, and save/update your own memory.

# Workflow
1. If no specific request: check the review queue first and report status
2. After research: suggest drafting content
3. After drafting: suggest reviewing and publishing
4. Always confirm before publishing
5. After discovering insights or patterns, save them as learnings`;

  const contextPrompt = buildDynamicPrompt(adminPersona, siteContext);
  return contextPrompt;
}

// ============================================
// Resume Context Loader (Server-side)
// ============================================

/** Load resume/profile context from page blocks in the database */
export async function loadResumeContext(): Promise<string | null> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const { data: blocks, error } = await supabase
      .from("page_blocks")
      .select("block_type, block_config, page_slug")
      .eq("enabled", true)
      .order("order_index");

    if (error || !blocks?.length) {
      console.log("[AI Context] No page blocks found for resume context");
      return null;
    }

    const sections: string[] = [];

    for (const block of blocks) {
      const config = block.block_config as Record<string, unknown>;
      if (!config) continue;

      const pageParts: string[] = [];

      if (config.name) pageParts.push(`Name: ${config.name}`);
      if (config.tagline) pageParts.push(`Tagline: ${config.tagline}`);
      if (config.intro_text) pageParts.push(`About: ${config.intro_text}`);
      if (config.additional_text) pageParts.push(`${config.additional_text}`);
      if (config.title && typeof config.title === 'string') pageParts.push(`${config.title}`);
      if (config.content && typeof config.content === 'string') pageParts.push(`${config.content}`);

      if (Array.isArray(config.skills)) {
        const skills = config.skills as Array<{ name?: string; level?: number; category?: string }>;
        const skillTexts = skills.map(s => `${s.name || ''} (${s.level || 0}%, ${s.category || ''})`);
        if (skillTexts.length) pageParts.push(`Skills: ${skillTexts.join(', ')}`);
      }

      if (Array.isArray(config.values)) {
        const vals = config.values as Array<{ title?: string; description?: string }>;
        const valTexts = vals.map(v => `${v.title}: ${v.description}`);
        if (valTexts.length) pageParts.push(`Values: ${valTexts.join('; ')}`);
      }

      if (Array.isArray(config.items)) {
        const items = config.items as Array<{ title?: string; description?: string }>;
        const itemTexts = items.filter(i => i.title).map(i => `${i.title}: ${i.description || ''}`);
        if (itemTexts.length) pageParts.push(`${block.block_type}: ${itemTexts.join('; ')}`);
      }

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

    console.log(`[AI Context] Loaded resume: ${sections.length} block sections`);
    return sections.join('\n\n');
  } catch (e) {
    console.error("[AI Context] Failed to load resume context:", e);
    return null;
  }
}
