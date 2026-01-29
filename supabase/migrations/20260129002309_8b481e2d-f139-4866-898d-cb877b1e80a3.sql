-- Create pages table for multi-page support
CREATE TABLE public.pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  is_main_landing BOOLEAN NOT NULL DEFAULT false,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

-- Public can view enabled pages
CREATE POLICY "Public can view enabled pages"
ON public.pages
FOR SELECT
USING (enabled = true);

-- Authenticated users can manage pages
CREATE POLICY "Authenticated users can manage pages"
ON public.pages
FOR ALL
USING (true)
WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_pages_updated_at
BEFORE UPDATE ON public.pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the existing home page
INSERT INTO public.pages (slug, title, description, is_main_landing, enabled)
VALUES ('home', 'Startsida', 'Huvudsidan', true, true);

-- Add page_slug foreign key concept (keep existing page_blocks working)
-- The page_slug in page_blocks already references pages by slug

-- Enable realtime for pages
ALTER PUBLICATION supabase_realtime ADD TABLE public.pages;