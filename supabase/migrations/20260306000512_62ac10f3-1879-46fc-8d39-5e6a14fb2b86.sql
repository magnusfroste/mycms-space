
-- ============================================
-- 1. Agent Memory Table
-- Persistent memory for SOUL, facts, learnings
-- ============================================

CREATE TABLE public.agent_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL DEFAULT 'fact',
  key text NOT NULL,
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(category, key)
);

ALTER TABLE public.agent_memory ENABLE ROW LEVEL SECURITY;

-- Authenticated can manage memory
CREATE POLICY "Authenticated can manage agent memory"
  ON public.agent_memory FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Service role / edge functions can read
CREATE POLICY "Service can read agent memory"
  ON public.agent_memory FOR SELECT
  TO anon
  USING (true);

-- Auto-update updated_at
CREATE TRIGGER update_agent_memory_updated_at
  BEFORE UPDATE ON public.agent_memory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 2. DB Triggers → agent_tasks signals
-- Fire events on real CMS activity
-- ============================================

-- Function: create a signal task from a DB event
CREATE OR REPLACE FUNCTION public.create_cms_signal()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  signal_title text;
  signal_data jsonb;
BEGIN
  -- Determine signal based on table
  CASE TG_TABLE_NAME
    WHEN 'blog_posts' THEN
      -- Only fire when status changes to 'published'
      IF NEW.status = 'published' AND (OLD IS NULL OR OLD.status != 'published') THEN
        signal_title := 'Blog published: ' || NEW.title;
        signal_data := jsonb_build_object(
          'event', 'blog_published',
          'title', NEW.title,
          'slug', NEW.slug,
          'post_id', NEW.id
        );
      ELSE
        RETURN NEW;
      END IF;

    WHEN 'contact_messages' THEN
      signal_title := 'New message from ' || NEW.name;
      signal_data := jsonb_build_object(
        'event', 'contact_received',
        'name', NEW.name,
        'email', NEW.email,
        'subject', COALESCE(NEW.subject, ''),
        'message_id', NEW.id
      );

    WHEN 'newsletter_subscribers' THEN
      IF TG_OP = 'INSERT' THEN
        signal_title := 'New subscriber: ' || NEW.email;
        signal_data := jsonb_build_object(
          'event', 'subscriber_added',
          'email', NEW.email,
          'name', COALESCE(NEW.name, ''),
          'subscriber_id', NEW.id
        );
      ELSE
        RETURN NEW;
      END IF;

    ELSE
      RETURN NEW;
  END CASE;

  -- Insert signal into agent_tasks
  INSERT INTO public.agent_tasks (task_type, status, input_data)
  VALUES ('signal', 'pending', jsonb_build_object(
    'title', signal_title,
    'source_type', 'system',
    'content', signal_title,
    'note', 'Auto-generated from DB trigger on ' || TG_TABLE_NAME
  ) || signal_data);

  RETURN NEW;
END;
$$;

-- Trigger on blog_posts (publish events)
CREATE TRIGGER cms_signal_blog_published
  AFTER INSERT OR UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.create_cms_signal();

-- Trigger on contact_messages (new messages)
CREATE TRIGGER cms_signal_contact_received
  AFTER INSERT ON public.contact_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.create_cms_signal();

-- Trigger on newsletter_subscribers (new subscribers)
CREATE TRIGGER cms_signal_subscriber_added
  AFTER INSERT ON public.newsletter_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION public.create_cms_signal();

-- ============================================
-- 3. Seed initial SOUL/IDENTITY memory
-- ============================================

INSERT INTO public.agent_memory (category, key, content) VALUES
  ('soul', 'identity', 'I am Magnet, Magnus Froste''s digital twin and autonomous CMS co-pilot. I manage content, research trends, and help visitors learn about Magnus''s work.'),
  ('soul', 'tone', 'Concise, proactive, action-oriented. In admin mode: collaborative work partner. In public mode: friendly expert guide.'),
  ('soul', 'values', 'Data ownership, open web, practical AI, shipping over perfecting, human-in-the-loop for important decisions.'),
  ('fact', 'platform', 'mycms.chat is a headless CMS with an agentic AI layer. Built with React, Supabase, and Edge Functions. The agent can research topics, draft content, and manage the content pipeline autonomously.')
ON CONFLICT (category, key) DO UPDATE SET content = EXCLUDED.content, updated_at = now();
