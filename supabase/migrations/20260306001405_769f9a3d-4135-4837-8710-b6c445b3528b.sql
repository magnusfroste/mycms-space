
-- ============================================
-- Agent Skills Table
-- Dynamic skills with handlers, tool definitions, instructions
-- ============================================

CREATE TABLE public.agent_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  handler text NOT NULL DEFAULT 'edge:ai-chat',
  category text NOT NULL DEFAULT 'automation',
  scope text NOT NULL DEFAULT 'internal',
  requires_approval boolean NOT NULL DEFAULT true,
  enabled boolean NOT NULL DEFAULT true,
  tool_definition jsonb DEFAULT '{}'::jsonb,
  instructions text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can manage agent skills"
  ON public.agent_skills FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Service can read agent skills"
  ON public.agent_skills FOR SELECT TO anon
  USING (true);

CREATE TRIGGER update_agent_skills_updated_at
  BEFORE UPDATE ON public.agent_skills
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Agent Activity Table
-- Logs every skill execution with duration, errors
-- ============================================

CREATE TABLE public.agent_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent text NOT NULL DEFAULT 'magnet',
  skill_id uuid REFERENCES public.agent_skills(id) ON DELETE SET NULL,
  skill_name text NOT NULL,
  input jsonb DEFAULT '{}'::jsonb,
  output jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'success',
  conversation_id text,
  duration_ms integer,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can manage agent activity"
  ON public.agent_activity FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Service can insert agent activity"
  ON public.agent_activity FOR INSERT TO anon
  WITH CHECK (true);

-- ============================================
-- Agent Objectives Table
-- Goal tracking with progress auto-increment
-- ============================================

CREATE TABLE public.agent_objectives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  constraints jsonb DEFAULT '{}'::jsonb,
  success_criteria jsonb DEFAULT '{}'::jsonb,
  progress jsonb DEFAULT '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_objectives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can manage agent objectives"
  ON public.agent_objectives FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Service can read agent objectives"
  ON public.agent_objectives FOR SELECT TO anon
  USING (true);

CREATE TRIGGER update_agent_objectives_updated_at
  BEFORE UPDATE ON public.agent_objectives
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Agent Automations Table
-- Cron + signal + event triggers
-- ============================================

CREATE TABLE public.agent_automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  trigger_type text NOT NULL DEFAULT 'cron',
  trigger_config jsonb DEFAULT '{}'::jsonb,
  skill_id uuid REFERENCES public.agent_skills(id) ON DELETE SET NULL,
  skill_name text NOT NULL,
  skill_arguments jsonb DEFAULT '{}'::jsonb,
  enabled boolean NOT NULL DEFAULT false,
  run_count integer NOT NULL DEFAULT 0,
  last_triggered_at timestamptz,
  last_error text,
  next_run_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can manage agent automations"
  ON public.agent_automations FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Service can read agent automations"
  ON public.agent_automations FOR SELECT TO anon
  USING (true);

CREATE TRIGGER update_agent_automations_updated_at
  BEFORE UPDATE ON public.agent_automations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Agent Objective Activities (link table)
-- ============================================

CREATE TABLE public.agent_objective_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id uuid NOT NULL REFERENCES public.agent_objectives(id) ON DELETE CASCADE,
  activity_id uuid NOT NULL REFERENCES public.agent_activity(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_objective_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can manage objective activities"
  ON public.agent_objective_activities FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ============================================
-- Seed default skills (matching FlowPilot pattern)
-- ============================================

INSERT INTO public.agent_skills (name, description, handler, category, scope, requires_approval, tool_definition) VALUES
  ('research_topic', 'Research a topic using web sources', 'edge:ai-chat', 'content', 'internal', false, '{"type":"function","function":{"name":"research_topic","description":"Research a topic using web search","parameters":{"type":"object","properties":{"topic":{"type":"string"}},"required":["topic"]}}}'::jsonb),
  ('draft_blog_post', 'Draft a blog post on a topic', 'module:blog', 'content', 'internal', true, '{"type":"function","function":{"name":"draft_blog_post","description":"Draft a blog post","parameters":{"type":"object","properties":{"title":{"type":"string"},"content":{"type":"string"},"excerpt":{"type":"string"}},"required":["title","content"]}}}'::jsonb),
  ('draft_all_channels', 'Generate multichannel content (blog + LinkedIn + X)', 'module:blog', 'content', 'internal', true, '{"type":"function","function":{"name":"draft_all_channels","description":"Generate multichannel content","parameters":{"type":"object","properties":{"topic":{"type":"string"},"blog_title":{"type":"string"},"blog_content":{"type":"string"},"linkedin_post":{"type":"string"},"x_post":{"type":"string"}},"required":["topic","blog_title","blog_content"]}}}'::jsonb),
  ('draft_newsletter', 'Draft a newsletter campaign', 'module:newsletter', 'content', 'internal', true, '{"type":"function","function":{"name":"draft_newsletter","description":"Draft a newsletter","parameters":{"type":"object","properties":{"subject":{"type":"string"},"content":{"type":"string"}},"required":["subject","content"]}}}'::jsonb),
  ('analyze_analytics', 'Get site analytics summary', 'db:page_views', 'analytics', 'both', false, '{"type":"function","function":{"name":"analyze_analytics","description":"Get site stats","parameters":{"type":"object","properties":{"period":{"type":"string","enum":["today","week","month"]}}}}}'::jsonb),
  ('generate_tailored_cv', 'Analyze job fit and generate CV', 'edge:ai-chat', 'portfolio', 'public', false, '{}'::jsonb),
  ('generate_portfolio', 'Generate curated portfolio', 'edge:ai-chat', 'portfolio', 'public', false, '{}'::jsonb),
  ('check_availability', 'Check availability for work', 'edge:ai-chat', 'portfolio', 'public', false, '{}'::jsonb)
ON CONFLICT (name) DO NOTHING;
