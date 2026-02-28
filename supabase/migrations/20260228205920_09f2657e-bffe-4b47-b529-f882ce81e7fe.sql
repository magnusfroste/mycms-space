
-- Create agent_tasks table for autonomous agent runs
CREATE TABLE public.agent_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_type TEXT NOT NULL, -- 'research', 'blog_draft', 'newsletter_draft', 'inbox_digest'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed', 'needs_review'
  input_data JSONB DEFAULT '{}'::jsonb,
  output_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can manage agent tasks
CREATE POLICY "Authenticated can manage agent tasks"
  ON public.agent_tasks FOR ALL
  USING (true)
  WITH CHECK (true);

-- Public can view completed tasks (for chat context enrichment)
CREATE POLICY "Public can view completed tasks"
  ON public.agent_tasks FOR SELECT
  USING (status = 'completed');

-- Trigger for updated_at
CREATE TRIGGER update_agent_tasks_updated_at
  BEFORE UPDATE ON public.agent_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add source column to blog_posts
ALTER TABLE public.blog_posts
  ADD COLUMN source TEXT NOT NULL DEFAULT 'manual'; -- 'manual' | 'agent'

-- Add agent_notes column to newsletter_campaigns
ALTER TABLE public.newsletter_campaigns
  ADD COLUMN agent_notes TEXT;
