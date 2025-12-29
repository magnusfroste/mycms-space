-- Create navigation links table
CREATE TABLE public.nav_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  is_external BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.nav_links ENABLE ROW LEVEL SECURITY;

-- Public can view enabled nav links
CREATE POLICY "Public can view enabled nav links"
ON public.nav_links
FOR SELECT
USING (enabled = true);

-- Allow public write for admin (no auth in this project)
CREATE POLICY "Allow public write on nav_links"
ON public.nav_links
FOR ALL
USING (true)
WITH CHECK (true);

-- Insert default navigation items
INSERT INTO public.nav_links (label, url, order_index, enabled, is_external) VALUES
  ('Expertise', '#expertise', 0, true, false),
  ('About', '#about', 1, true, false),
  ('Portfolio', '#portfolio', 2, true, false),
  ('Contact', '#contact', 3, true, false);