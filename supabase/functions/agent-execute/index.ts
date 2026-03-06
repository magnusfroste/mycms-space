// ============================================
// Agent Execute — Skill Execution Engine
// Routes skill calls to handlers (edge, module, db)
// Logs activity and tracks objective progress
// ============================================

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ExecuteRequest {
  skill_id?: string;
  skill_name?: string;
  arguments: Record<string, unknown>;
  agent_type: 'magnet' | 'chat';
  conversation_id?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const body: ExecuteRequest = await req.json();
    const { skill_id, skill_name, arguments: args, agent_type, conversation_id } = body;

    if (!skill_id && !skill_name) {
      return new Response(JSON.stringify({ error: 'skill_id or skill_name required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Look up the skill
    let query = supabase.from('agent_skills').select('*').eq('enabled', true);
    if (skill_id) query = query.eq('id', skill_id);
    else if (skill_name) query = query.eq('name', skill_name);

    const { data: skill, error: skillError } = await query.limit(1).single();
    if (skillError || !skill) {
      return new Response(JSON.stringify({ error: `Skill not found: ${skill_id || skill_name}` }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Validate scope
    if (agent_type === 'chat' && skill.scope === 'internal') {
      await logActivity(supabase, {
        agent: agent_type, skill_id: skill.id, skill_name: skill.name,
        input: args, output: { error: 'Scope violation' },
        status: 'failed', conversation_id, duration_ms: Date.now() - startTime,
        error_message: `Skill '${skill.name}' is internal-only`,
      });
      return new Response(JSON.stringify({ error: 'This action is not available' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Check requires_approval
    if (skill.requires_approval) {
      await logActivity(supabase, {
        agent: agent_type, skill_id: skill.id, skill_name: skill.name,
        input: args, output: {}, status: 'pending_approval',
        conversation_id, duration_ms: Date.now() - startTime,
      });
      return new Response(JSON.stringify({
        status: 'pending_approval',
        skill: skill.name,
        message: `Action '${skill.name}' requires admin approval.`,
        input: args,
      }), {
        status: 202, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. Route to handler
    let result: unknown;
    const handler = skill.handler as string;

    if (handler.startsWith('edge:')) {
      const fnName = handler.replace('edge:', '');
      const response = await fetch(`${supabaseUrl}/functions/v1/${fnName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
        },
        body: JSON.stringify(args),
      });
      result = await response.json();
    } else if (handler.startsWith('module:')) {
      const moduleName = handler.replace('module:', '');
      result = await executeModuleAction(supabase, moduleName, skill.name, args);
    } else if (handler.startsWith('db:')) {
      const table = handler.replace('db:', '');
      result = await executeDbAction(supabase, table, args);
    } else {
      result = { error: `Unknown handler type: ${handler}` };
    }

    // 5. Log activity
    const activityId = await logActivity(supabase, {
      agent: agent_type, skill_id: skill.id, skill_name: skill.name,
      input: args, output: result as Record<string, unknown>,
      status: 'success', conversation_id,
      duration_ms: Date.now() - startTime,
    });

    // 6. Auto-track objective progress
    if (activityId) {
      await trackObjectiveProgress(supabase, skill.name, activityId);
    }

    return new Response(JSON.stringify({ status: 'success', result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('agent-execute error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message || 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ============================================
// Module Actions
// ============================================

async function executeModuleAction(
  supabase: ReturnType<typeof createClient>,
  moduleName: string,
  _skillName: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  switch (moduleName) {
    case 'blog': {
      const { title, content, excerpt, seo_keywords } = args as any;
      const slug = (title as string).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const { data, error } = await supabase.from('blog_posts').insert({
        title, slug, content: content || '', excerpt: excerpt || '',
        status: 'draft', source: 'magnet',
        seo_keywords: seo_keywords || [],
      }).select('id, slug, title, status').single();
      if (error) throw new Error(`Blog insert failed: ${error.message}`);
      return { blog_post_id: data.id, slug: data.slug, title: data.title, status: 'draft' };
    }
    case 'newsletter': {
      const { subject, content } = args as any;
      const { data, error } = await supabase.from('newsletter_campaigns').insert({
        subject, content, status: 'draft', agent_notes: 'Created by Magnet',
      }).select('id, subject, status').single();
      if (error) throw new Error(`Newsletter insert failed: ${error.message}`);
      return { campaign_id: data.id, subject: data.subject, status: 'draft' };
    }
    default:
      return { error: `Unknown module: ${moduleName}` };
  }
}

// ============================================
// DB Actions
// ============================================

async function executeDbAction(
  supabase: ReturnType<typeof createClient>,
  table: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  switch (table) {
    case 'page_views': {
      const { period = 'week' } = args as any;
      const now = new Date();
      const since = new Date(now);
      switch (period) {
        case 'today': since.setHours(0, 0, 0, 0); break;
        case 'week': since.setDate(now.getDate() - 7); break;
        case 'month': since.setMonth(now.getMonth() - 1); break;
      }
      const { data, error } = await supabase.from('page_views')
        .select('page_slug, created_at')
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw new Error(`Analytics query failed: ${error.message}`);
      const views = data || [];
      const uniqueSlugs = [...new Set(views.map((v: any) => v.page_slug))];
      const topPages = uniqueSlugs.map(slug => ({
        slug,
        views: views.filter((v: any) => v.page_slug === slug).length,
      })).sort((a, b) => b.views - a.views).slice(0, 10);
      return { period, total_views: views.length, unique_pages: uniqueSlugs.length, top_pages: topPages };
    }
    default:
      return { error: `Unknown table handler: ${table}` };
  }
}

// ============================================
// Activity Logging
// ============================================

async function logActivity(
  supabase: ReturnType<typeof createClient>,
  activity: {
    agent: string; skill_id: string; skill_name: string;
    input: Record<string, unknown>; output: Record<string, unknown>;
    status: string; conversation_id?: string; duration_ms: number;
    error_message?: string;
  },
): Promise<string | null> {
  const { data, error } = await supabase.from('agent_activity').insert({
    agent: activity.agent,
    skill_id: activity.skill_id,
    skill_name: activity.skill_name,
    input: activity.input,
    output: activity.output,
    status: activity.status,
    conversation_id: activity.conversation_id || null,
    duration_ms: activity.duration_ms,
    error_message: activity.error_message || null,
  }).select('id').single();
  if (error) console.error('Failed to log activity:', error);
  return data?.id || null;
}

// ============================================
// Objective Progress Auto-Tracking
// ============================================

const SKILL_OBJECTIVE_MAP: Record<string, string[]> = {
  draft_blog_post: ['blog', 'content', 'publish', 'article'],
  draft_all_channels: ['content', 'multichannel', 'marketing'],
  draft_newsletter: ['newsletter', 'email', 'subscriber'],
  research_topic: ['research', 'content'],
  analyze_analytics: ['analytics', 'traffic', 'growth'],
};

async function trackObjectiveProgress(
  supabase: ReturnType<typeof createClient>,
  skillName: string,
  activityId: string,
): Promise<void> {
  try {
    const { data: objectives } = await supabase
      .from('agent_objectives')
      .select('id, goal, progress')
      .eq('status', 'active');
    if (!objectives?.length) return;

    const keywords = SKILL_OBJECTIVE_MAP[skillName] || [];
    if (!keywords.length) return;

    for (const obj of objectives) {
      const goalLower = obj.goal.toLowerCase();
      const matches = keywords.some(kw => goalLower.includes(kw));
      if (!matches) continue;

      await supabase.from('agent_objective_activities').insert({
        objective_id: obj.id, activity_id: activityId,
      }).select().maybeSingle();

      const progress = (obj.progress as Record<string, unknown>) || {};
      const totalActions = ((progress.total_actions as number) || 0) + 1;
      await supabase.from('agent_objectives').update({
        progress: {
          ...progress,
          [skillName]: ((progress[skillName] as number) || 0) + 1,
          total_actions: totalActions,
          last_skill: skillName,
          last_action_at: new Date().toISOString(),
        },
      }).eq('id', obj.id);
    }
  } catch (err) {
    console.error('[objective-tracker] Error:', err);
  }
}
