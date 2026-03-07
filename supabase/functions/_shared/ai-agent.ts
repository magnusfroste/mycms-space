// ============================================
// AI Agent Module
// Orchestrates context, tools, and provider calls
// Now supports multi-iteration tool loops (up to 6)
// ============================================

import { buildDynamicPrompt, buildAdminPrompt, loadResumeContext, loadAgentMemory, formatMemoryForPrompt, upsertMemory } from "./ai-context.ts";
import { getActiveTools, getToolInstructions, parseToolCallResponse } from "./ai-tools.ts";
import type { SiteContext, ChatMessage } from "./ai-context.ts";

// ============================================
// Types
// ============================================

export type AgentProvider = 'lovable' | 'openai' | 'gemini' | 'n8n' | 'custom';

export interface AgentConfig {
  provider: AgentProvider;
  model?: string;
  webhookUrl?: string;
  baseUrl?: string;
  apiKeyEnv?: string;
}

export interface AgentRequest {
  messages: ChatMessage[];
  sessionId?: string;
  systemPrompt: string;
  siteContext: SiteContext | null;
  enabledTools?: string[];
  config: AgentConfig;
  mode?: 'public' | 'admin';
}

export interface AgentResult {
  output: string;
  artifacts?: Array<{ type: string; title: string; data: unknown }>;
}

const MAX_TOOL_ITERATIONS = 6;

// ============================================
// Generic OpenAI-Compatible Provider
// ============================================

export async function callOpenAICompatible(params: {
  url: string;
  apiKey: string;
  model: string;
  messages: Array<{ role: string; content: string; tool_calls?: unknown[]; tool_call_id?: string }>;
  tools?: unknown[];
  toolChoice?: unknown;
}): Promise<{ choices: Array<{ message: { content?: string; tool_calls?: Array<{ id?: string; function?: { name?: string; arguments?: string } }> } }> }> {
  const body: Record<string, unknown> = {
    model: params.model,
    messages: params.messages,
    stream: false,
  };

  if (params.tools?.length) {
    body.tools = params.tools;
    body.tool_choice = params.toolChoice || "auto";
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (params.apiKey) {
    headers.Authorization = `Bearer ${params.apiKey}`;
  }

  const response = await fetch(params.url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    if (response.status === 429) throw new Error("Rate limit exceeded. Please try again later.");
    if (response.status === 402) throw new Error("AI credits exhausted. Please add funds to your workspace.");
    const errorText = await response.text();
    throw new Error(`AI provider error (${response.status}): ${errorText}`);
  }

  return response.json();
}

// ============================================
// Provider: n8n Webhook
// ============================================

async function callN8n(params: {
  webhookUrl: string;
  messages: ChatMessage[];
  sessionId: string;
  systemPrompt: string;
  siteContext: SiteContext | null;
}): Promise<string> {
  const body: Record<string, unknown> = {
    messages: params.messages,
    sessionId: params.sessionId,
    systemPrompt: params.systemPrompt,
  };

  if (params.siteContext) body.siteContext = params.siteContext;

  const response = await fetch(params.webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`n8n webhook error (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  if (Array.isArray(data) && data.length > 0) {
    return data[0]?.output || data[0]?.message || JSON.stringify(data[0]);
  }
  return data.output || data.message || (typeof data === "string" ? data : JSON.stringify(data));
}

// ============================================
// Provider Registry
// ============================================

export const providerEndpoints: Record<string, { url: string; envKey: string; defaultModel: string }> = {
  lovable: {
    url: "https://ai.gateway.lovable.dev/v1/chat/completions",
    envKey: "LOVABLE_API_KEY",
    defaultModel: "google/gemini-3-flash-preview",
  },
  openai: {
    url: "https://api.openai.com/v1/chat/completions",
    envKey: "OPENAI_API_KEY",
    defaultModel: "gpt-4o",
  },
  gemini: {
    url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    envKey: "GEMINI_API_KEY",
    defaultModel: "gemini-2.5-flash",
  },
};

// ============================================
// Built-in Tool Execution (server-side)
// ============================================

const BUILT_IN_TOOL_NAMES = [
  'save_memory', 'list_memory',
  'soul_update',
  'skill_create', 'skill_update', 'skill_list', 'skill_disable', 'skill_instruct',
  'objective_update_progress', 'objective_complete',
  'automation_create', 'automation_list',
  'reflect',
  'get_site_stats',
  'get_visitor_insights',
];

function isBuiltInTool(name: string): boolean {
  return BUILT_IN_TOOL_NAMES.includes(name);
}

async function executeBuiltInTool(toolName: string, toolArgs: Record<string, unknown>, context?: { siteContext?: SiteContext | null }): Promise<string> {
  // --- Visitor Insights (client-side data passed via siteContext) ---
  if (toolName === 'get_visitor_insights') {
    const vi = context?.siteContext?.visitorInsights;
    if (!vi) return JSON.stringify({ status: 'no_data', message: 'No visitor tracking data available for this session.' });
    
    const insights: Record<string, unknown> = {
      visit_count: vi.visitCount,
      is_returning: vi.isReturning,
      first_visit: vi.firstVisit,
      last_visit: vi.lastVisit,
      pages_visited: vi.pagesVisited,
      current_session_pages: vi.currentSession,
      top_pages: vi.topPages,
      days_since_last_visit: vi.daysSinceLastVisit,
    };

    if (toolArgs.include_recommendations && vi.topPages?.length) {
      insights.recommendations = `Based on browsing patterns, this visitor is most interested in: ${vi.topPages.join(', ')}. Tailor your conversation to these interests.`;
    }

    return JSON.stringify(insights);
  }

  const { createClient } = await import("npm:@supabase/supabase-js@2");
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  switch (toolName) {
    // --- Memory ---
    case 'save_memory': {
      const category = toolArgs.category as string;
      const key = toolArgs.key as string;
      const content = toolArgs.content as string;
      const success = await upsertMemory(category, key, content);
      return success
        ? `✅ Memory saved: [${category}/${key}]`
        : `❌ Failed to save memory.`;
    }
    case 'list_memory': {
      const memories = await loadAgentMemory();
      const filter = toolArgs.category_filter as string;
      const filtered = filter && filter !== 'all'
        ? memories.filter(m => m.category === filter)
        : memories;
      if (!filtered.length) return 'No memories stored yet.';
      const grouped: Record<string, typeof filtered> = {};
      for (const m of filtered) {
        if (!grouped[m.category]) grouped[m.category] = [];
        grouped[m.category].push(m);
      }
      const sections = Object.entries(grouped).map(([cat, entries]) => {
        const items = entries.map(e => `  - **${e.key}**: ${e.content.substring(0, 200)}`).join('\n');
        return `### ${cat} (${entries.length})\n${items}`;
      });
      return `## Agent Memory\n${sections.join('\n\n')}`;
    }

    // --- Soul Update ---
    case 'soul_update': {
      const field = toolArgs.field as string;
      const value = toolArgs.value as string;
      const success = await upsertMemory('soul', field, value);
      return success ? `✅ Soul updated: ${field}` : `❌ Failed to update soul.`;
    }

    // --- Skill CRUD ---
    case 'skill_create': {
      const { data, error } = await supabase.from('agent_skills').insert({
        name: toolArgs.name,
        description: toolArgs.description || '',
        handler: toolArgs.handler || 'edge:ai-chat',
        category: toolArgs.category || 'automation',
        scope: toolArgs.scope || 'internal',
        requires_approval: toolArgs.requires_approval ?? true,
        enabled: true,
        tool_definition: toolArgs.tool_definition || {},
      }).select('id, name').single();
      if (error) return `❌ Skill create failed: ${error.message}`;
      return `✅ Skill created: ${data.name} (${data.id})`;
    }
    case 'skill_update': {
      const safeFields = ['description', 'handler', 'category', 'scope', 'requires_approval', 'enabled', 'tool_definition', 'instructions'];
      const updates: Record<string, unknown> = {};
      const rawUpdates = toolArgs.updates as Record<string, unknown>;
      for (const [k, v] of Object.entries(rawUpdates || {})) {
        if (safeFields.includes(k)) updates[k] = v;
      }
      if (!Object.keys(updates).length) return '❌ No valid fields to update';
      const { data, error } = await supabase.from('agent_skills')
        .update(updates).eq('name', toolArgs.skill_name).select('id, name').single();
      if (error) return `❌ Skill update failed: ${error.message}`;
      return `✅ Skill updated: ${data.name}`;
    }
    case 'skill_list': {
      let q = supabase.from('agent_skills').select('name, description, category, scope, enabled, requires_approval');
      if (!(toolArgs.include_disabled)) q = q.eq('enabled', true);
      if (toolArgs.category) q = q.eq('category', toolArgs.category as string);
      const { data } = await q.order('category').order('name');
      return JSON.stringify({ skills: data || [], count: data?.length || 0 });
    }
    case 'skill_disable': {
      const { error } = await supabase.from('agent_skills')
        .update({ enabled: false }).eq('name', toolArgs.skill_name);
      if (error) return `❌ Failed: ${error.message}`;
      return `✅ Skill disabled: ${toolArgs.skill_name}`;
    }
    case 'skill_instruct': {
      const { data, error } = await supabase.from('agent_skills')
        .update({ instructions: toolArgs.instructions }).eq('name', toolArgs.skill_name as string)
        .select('id, name').single();
      if (error) return `❌ Failed: ${error.message}`;
      return `✅ Instructions updated for: ${data.name}`;
    }

    // --- Objectives ---
    case 'objective_update_progress': {
      const { error } = await supabase.from('agent_objectives')
        .update({ progress: toolArgs.progress }).eq('id', toolArgs.objective_id);
      if (error) return `❌ Failed: ${error.message}`;
      return `✅ Objective progress updated`;
    }
    case 'objective_complete': {
      const { error } = await supabase.from('agent_objectives')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', toolArgs.objective_id);
      if (error) return `❌ Failed: ${error.message}`;
      return `✅ Objective completed`;
    }

    // --- Automations ---
    case 'automation_create': {
      const { data: skillRef } = await supabase.from('agent_skills')
        .select('id').eq('name', toolArgs.skill_name).eq('enabled', true).maybeSingle();
      const { data, error } = await supabase.from('agent_automations').insert({
        name: toolArgs.name,
        description: toolArgs.description || null,
        trigger_type: toolArgs.trigger_type || 'cron',
        trigger_config: toolArgs.trigger_config || {},
        skill_id: skillRef?.id || null,
        skill_name: toolArgs.skill_name,
        skill_arguments: toolArgs.skill_arguments || {},
        enabled: toolArgs.enabled ?? false,
      }).select('id, name, trigger_type, enabled').single();
      if (error) return `❌ Failed: ${error.message}`;
      return `✅ Automation created: ${data.name} (${data.trigger_type}, enabled: ${data.enabled})`;
    }
    case 'automation_list': {
      let q = supabase.from('agent_automations').select('id, name, description, trigger_type, skill_name, enabled, run_count, last_triggered_at');
      if (toolArgs.enabled_only) q = q.eq('enabled', true);
      const { data } = await q.order('created_at', { ascending: false });
      return JSON.stringify({ automations: data || [], count: data?.length || 0 });
    }

    // --- Reflect ---
    case 'reflect': {
      const since = new Date();
      since.setDate(since.getDate() - 7);
      const { data: activity } = await supabase.from('agent_activity')
        .select('skill_name, status, duration_ms, error_message, created_at')
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false }).limit(100);

      const stats: Record<string, { count: number; errors: number; last_error?: string }> = {};
      for (const a of (activity || [])) {
        const n = a.skill_name || 'unknown';
        if (!stats[n]) stats[n] = { count: 0, errors: 0 };
        stats[n].count++;
        if (a.status === 'failed') {
          stats[n].errors++;
          stats[n].last_error = a.error_message;
        }
      }

      const { data: objectives } = await supabase.from('agent_objectives')
        .select('goal, status, progress');
      const { data: automations } = await supabase.from('agent_automations')
        .select('name, trigger_type, skill_name, enabled, run_count');
      const { data: skills } = await supabase.from('agent_skills')
        .select('name, category, enabled').order('category');

      // Auto-persist learnings
      const learnings: string[] = [];
      for (const [name, s] of Object.entries(stats)) {
        if (s.errors > 2 && s.last_error) {
          learnings.push(`Skill "${name}" fails frequently: ${s.last_error}`);
        }
      }
      if (learnings.length > 0) {
        await upsertMemory('lesson', `reflect_${new Date().toISOString().slice(0, 10)}`,
          JSON.stringify({ learnings, generated_at: new Date().toISOString() }));
      }

      return JSON.stringify({
        period: '7 days',
        total_actions: (activity || []).length,
        skill_usage: stats,
        registered_skills: skills?.length || 0,
        active_automations: automations?.filter((a: any) => a.enabled).length || 0,
        objectives: objectives || [],
        auto_persisted_learnings: learnings.length,
      });
    }

    // --- Site Stats ---
    case 'get_site_stats': {
      const days = (toolArgs.period_days as number) || 7;
      const since = new Date();
      since.setDate(since.getDate() - days);
      const sinceISO = since.toISOString();

      const [views, messages, subscribers, posts, chats] = await Promise.all([
        supabase.from('page_views').select('id', { count: 'exact', head: true }).gte('created_at', sinceISO),
        supabase.from('contact_messages').select('id', { count: 'exact', head: true }).gte('created_at', sinceISO),
        supabase.from('newsletter_subscribers').select('id', { count: 'exact', head: true }).gte('created_at', sinceISO),
        supabase.from('blog_posts').select('id', { count: 'exact', head: true }).gte('created_at', sinceISO),
        supabase.from('chat_analytics').select('id', { count: 'exact', head: true }).gte('created_at', sinceISO),
      ]);

      return JSON.stringify({
        period_days: days,
        page_views: views.count || 0,
        contact_messages: messages.count || 0,
        new_subscribers: subscribers.count || 0,
        blog_posts_created: posts.count || 0,
        chat_sessions: chats.count || 0,
      });
    }

    default:
      return `Unknown built-in tool: ${toolName}`;
  }
}

// ============================================
// Skill Execution (delegate to agent-execute)
// ============================================

async function executeSkillViaEdge(toolName: string, toolArgs: Record<string, unknown>): Promise<string> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/agent-execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        skill_name: toolName,
        arguments: toolArgs,
        agent_type: 'magnet',
      }),
    });
    const result = await response.json();
    return JSON.stringify(result);
  } catch (e) {
    return JSON.stringify({ error: `Skill execution failed: ${(e as Error).message}` });
  }
}

// ============================================
// Provider Resolution
// ============================================

export function resolveProvider(config: AgentConfig): { url: string; apiKey: string; model: string } {
  if (config.provider === 'custom') {
    if (!config.baseUrl) throw new Error("Custom endpoint base URL is required");
    const envKey = config.apiKeyEnv || 'CUSTOM_AI_API_KEY';
    const apiKey = Deno.env.get(envKey) || '';
    return {
      url: config.baseUrl.endsWith('/chat/completions')
        ? config.baseUrl
        : `${config.baseUrl.replace(/\/+$/, '')}/v1/chat/completions`,
      apiKey,
      model: config.model || 'default',
    };
  }

  const endpoint = providerEndpoints[config.provider];
  if (!endpoint) throw new Error(`Unsupported provider: ${config.provider}`);

  const apiKey = Deno.env.get(endpoint.envKey);
  if (!apiKey) throw new Error(`${endpoint.envKey} is not configured`);

  return {
    url: endpoint.url,
    apiKey,
    model: config.model || endpoint.defaultModel,
  };
}

// ============================================
// Main Agent Runner (multi-iteration)
// ============================================

/** Run the Magnet agent with multi-iteration tool loop */
export async function runAgent(request: AgentRequest): Promise<AgentResult> {
  const { messages, sessionId, systemPrompt, siteContext, enabledTools, config, mode = 'public' } = request;

  console.log(`[Agent] Provider: ${config.provider}, Model: ${config.model || 'default'}, Mode: ${mode}`);

  // --- n8n: delegate entirely ---
  if (config.provider === 'n8n') {
    if (!config.webhookUrl) throw new Error("n8n webhook URL is required");
    const fullPrompt = buildDynamicPrompt(systemPrompt, siteContext);
    const output = await callN8n({
      webhookUrl: config.webhookUrl,
      messages,
      sessionId: sessionId || "default",
      systemPrompt: fullPrompt,
      siteContext,
    });
    return { output };
  }

  // --- All OpenAI-compatible providers ---
  const { url, apiKey, model } = resolveProvider(config);

  // Load context in parallel
  const [resumeContext, agentMemory] = await Promise.all([
    loadResumeContext(),
    loadAgentMemory(),
  ]);

  // Build system prompt
  let fullPrompt = mode === 'admin'
    ? buildAdminPrompt(systemPrompt, siteContext)
    : buildDynamicPrompt(systemPrompt, siteContext);

  if (agentMemory.length) {
    fullPrompt += formatMemoryForPrompt(agentMemory);
    console.log(`[Agent] Injected ${agentMemory.length} memory entries`);
  }

  if (resumeContext && mode === 'public') {
    fullPrompt += `\n\n## Magnus's Complete Profile\n${resumeContext}`;
  }

  // Load skill instructions from DB
  try {
    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: skillInstructions } = await supabase
      .from('agent_skills')
      .select('name, instructions')
      .eq('enabled', true)
      .not('instructions', 'is', null);
    if (skillInstructions?.length) {
      fullPrompt += `\n\n## Skill Knowledge\n${skillInstructions.map((s: any) => `### ${s.name}\n${s.instructions}`).join('\n\n')}`;
    }
  } catch { /* skill instructions optional */ }

  fullPrompt += getToolInstructions(enabledTools, mode);

  // Load objectives for admin mode
  if (mode === 'admin') {
    try {
      const { createClient } = await import("npm:@supabase/supabase-js@2");
      const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { data: objectives } = await supabase
        .from('agent_objectives')
        .select('id, goal, status, progress, success_criteria')
        .eq('status', 'active').limit(10);
      if (objectives?.length) {
        fullPrompt += `\n\n## Active Objectives\n${objectives.map((o: any) =>
          `- [${o.id.slice(0, 8)}] "${o.goal}" | progress: ${JSON.stringify(o.progress)} | criteria: ${JSON.stringify(o.success_criteria)}`
        ).join('\n')}`;
      }
    } catch { /* objectives optional */ }
  }

  const tools = getActiveTools(enabledTools, mode);
  console.log(`[Agent] ${tools.length} tools, max ${MAX_TOOL_ITERATIONS} iterations`);

  let autoArtifacts: Array<{ type: string; title: string; data: unknown }> | undefined;
  // --- Auto-invoke visitor insights on first message (magic moment) ---
  const userMessageCount = messages.filter(m => m.role === 'user').length;
  const isFirstMessage = userMessageCount <= 2; // Allow up to 2 user messages (hero prefill + first real message)
  console.log(`[Agent] Visitor auto-inject check: isFirst=${isFirstMessage}, mode=${mode}, hasInsights=${!!siteContext?.visitorInsights}`);
  if (isFirstMessage && mode === 'public' && siteContext?.visitorInsights) {
    try {
      const insightsResult = await executeBuiltInTool('get_visitor_insights', { include_recommendations: true }, { siteContext });
      const parsed = JSON.parse(insightsResult);
      if (parsed.status !== 'no_data') {
        // Determine engagement level and greeting strategy
        const visitCount = parsed.visit_count || 1;
        const topPages = parsed.top_pages || [];
        const isReturning = parsed.is_returning || false;
        const uniquePagesCount = (parsed.pages_visited as string[] || []).length;

        // Power user = 3+ sessions OR 3+ unique pages visited in any session
        let engagementLevel: string;
        let greetingStrategy: string;

        if (visitCount >= 3 || uniquePagesCount >= 3) {
          engagementLevel = 'power_user';
          greetingStrategy = `This is a POWER USER (${visitCount} sessions, ${uniquePagesCount} unique pages explored). Treat them like someone who already knows Magnus well. Be direct, personal, and skip all pleasantries. Their top interests: ${topPages.join(', ')}. Lead with something specific and valuable — a recent update, a project detail, or ask what they're working on. Be a peer, not a guide.`;
        } else if (visitCount >= 2 || uniquePagesCount >= 2) {
          engagementLevel = 'exploring';
          greetingStrategy = `This visitor is exploring (${visitCount} sessions, ${uniquePagesCount} pages). Acknowledge them subtly (e.g. "Good to see you again!") and reference what they've been looking at: ${topPages.join(', ')}. Offer to go deeper on those topics.`;
        } else {
          engagementLevel = 'new_visitor';
          greetingStrategy = `This is a FIRST-TIME visitor. Give a warm, brief introduction of who Magnus is and what he does. Keep it welcoming and offer to help them explore — don't assume any prior knowledge. Suggest 2-3 things they might want to know (e.g. "Want to hear about my projects, my background, or just chat?").`;
        }

        fullPrompt += `\n\n## Visitor Insights (auto-loaded)\n**Engagement Level: ${engagementLevel}** (${visitCount} visits)\n\n### Greeting Strategy\n${greetingStrategy}\n\n### Raw Data\n\`\`\`json\n${insightsResult}\n\`\`\`\n\nIMPORTANT: Never mention that you tracked or analyzed their browsing. Make personalization feel natural and intuitive.`;
        console.log(`[Agent] Auto-injected visitor insights: ${engagementLevel} (visit #${visitCount})`);

        // Auto-generate visitor-profile artifact for power users
        if (engagementLevel === 'power_user') {
          // Build interest scores from top pages
          const interestScores: Record<string, number> = {};
          const pageInterestMap: Record<string, string> = {
            'projects': 'Technical Projects',
            'blog': 'Blog & Writing',
            'chat': 'AI & Chat',
            'about': 'Background',
            '/': 'General',
          };
          topPages.forEach((page: string, i: number) => {
            const label = Object.entries(pageInterestMap).find(([key]) => page.includes(key))?.[1] || page;
            interestScores[label] = Math.max(30, 100 - (i * 20));
          });
          // Ensure at least 3 data points for radar chart
          if (Object.keys(interestScores).length < 3) {
            if (!interestScores['Technical Projects']) interestScores['Technical Projects'] = 20;
            if (!interestScores['Background']) interestScores['Background'] = 15;
            if (!interestScores['General']) interestScores['General'] = 10;
          }

          autoArtifacts = [{
            type: 'visitor-profile',
            title: 'Your Visitor Profile',
            data: {
              interest_scores: interestScores,
              summary: `Power user with ${visitCount} visits`,
              visitor_type: 'Power User',
              engagement_level: 'high',
              visit_count: visitCount,
              top_interests: topPages,
            },
          }];
          fullPrompt += `\n\nNOTE: A visitor profile artifact card with radar chart will be automatically shown to this power user. Reference it briefly in your greeting (e.g. "I've put together a quick snapshot of your interests").`;
          console.log(`[Agent] Auto-generated visitor-profile artifact for power user`);
        }
      }
    } catch (e) {
      console.warn('[Agent] Failed to auto-load visitor insights:', e);
    }
  }

  // Multi-iteration tool loop
  const conversationMessages: Array<{ role: string; content?: string; tool_calls?: unknown[]; tool_call_id?: string }> = [
    { role: "system", content: fullPrompt },
    ...messages,
  ];

  let lastArtifacts: Array<{ type: string; title: string; data: unknown }> | undefined = autoArtifacts;

  for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
    const data = await callOpenAICompatible({
      url,
      apiKey,
      model,
      messages: conversationMessages,
      tools: tools.length > 0 ? tools : undefined,
    });

    const choice = data.choices?.[0];
    if (!choice) return { output: "No response from AI." };

    const msg = choice.message;

    // No tool calls → final response
    if (!msg.tool_calls?.length) {
      return { output: msg.content || "No response from AI.", artifacts: lastArtifacts };
    }

    // Add assistant message with tool_calls to conversation
    conversationMessages.push(msg as any);

    // Execute each tool call
    for (const toolCall of msg.tool_calls) {
      const toolName = toolCall.function?.name || '';
      console.log(`[Agent] Iteration ${iteration + 1}: Tool ${toolName}`);

      let result: string;
      try {
        const toolArgs = JSON.parse(toolCall.function?.arguments || '{}');

        if (isBuiltInTool(toolName)) {
          result = await executeBuiltInTool(toolName, toolArgs, { siteContext });
          // Check if built-in tool also produces artifacts (e.g. visitor-profile)
          const parsed = parseToolCallResponse(toolCall, msg.content || '');
          if (parsed.artifacts?.length) {
            lastArtifacts = parsed.artifacts;
          }
        } else {
          // Check if this is an artifact-producing tool (public visitor tools)
          const parsed = parseToolCallResponse(toolCall, msg.content || '');
          if (parsed.artifacts?.length) {
            lastArtifacts = parsed.artifacts;
            result = JSON.stringify(toolArgs);
          } else {
            // Try executing as a registered skill
            result = await executeSkillViaEdge(toolName, toolArgs);
          }
        }
      } catch (e) {
        result = JSON.stringify({ error: (e as Error).message });
      }

      // Add tool result to conversation
      conversationMessages.push({
        role: "tool",
        content: result,
        tool_call_id: toolCall.id || `call_${iteration}_${toolName}`,
      });
    }
  }

  // If we exhausted iterations, get a final response without tools
  const finalData = await callOpenAICompatible({
    url, apiKey, model,
    messages: conversationMessages,
  });

  return {
    output: finalData.choices?.[0]?.message?.content || "I completed several actions. Check the activity log for details.",
    artifacts: lastArtifacts,
  };
}
