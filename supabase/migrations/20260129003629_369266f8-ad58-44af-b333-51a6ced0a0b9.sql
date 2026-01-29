-- Analytics tables for tracking page views, project engagement, and chat stats

-- Page views tracking
CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug text NOT NULL,
  visitor_id text NOT NULL,
  user_agent text,
  referrer text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Project views tracking  
CREATE TABLE public.project_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  visitor_id text NOT NULL,
  action text NOT NULL DEFAULT 'view',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Chat analytics
CREATE TABLE public.chat_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id text NOT NULL,
  message_count integer NOT NULL DEFAULT 1,
  session_start timestamp with time zone NOT NULL DEFAULT now(),
  session_end timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_analytics ENABLE ROW LEVEL SECURITY;

-- Public insert policies (anyone can log analytics)
CREATE POLICY "Anyone can insert page views"
  ON public.page_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can insert project views"
  ON public.project_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can insert chat analytics"
  ON public.chat_analytics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update chat analytics"
  ON public.chat_analytics FOR UPDATE
  USING (true);

-- Authenticated users can read analytics
CREATE POLICY "Authenticated can read page views"
  ON public.page_views FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can read project views"
  ON public.project_views FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can read chat analytics"
  ON public.chat_analytics FOR SELECT
  TO authenticated
  USING (true);

-- Indexes for performance
CREATE INDEX idx_page_views_created_at ON public.page_views(created_at DESC);
CREATE INDEX idx_page_views_page_slug ON public.page_views(page_slug);
CREATE INDEX idx_project_views_created_at ON public.project_views(created_at DESC);
CREATE INDEX idx_project_views_project_id ON public.project_views(project_id);
CREATE INDEX idx_chat_analytics_created_at ON public.chat_analytics(created_at DESC);