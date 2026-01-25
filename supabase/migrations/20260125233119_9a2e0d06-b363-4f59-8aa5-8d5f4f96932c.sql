-- Create page_blocks table for dynamic page composition
CREATE TABLE public.page_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug TEXT NOT NULL,
  block_type TEXT NOT NULL,
  block_config JSONB DEFAULT '{}',
  order_index INTEGER NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.page_blocks ENABLE ROW LEVEL SECURITY;

-- Public can read enabled blocks
CREATE POLICY "Public can view enabled blocks"
ON public.page_blocks
FOR SELECT
USING (enabled = true);

-- Authenticated users can manage all blocks
CREATE POLICY "Authenticated users can manage blocks"
ON public.page_blocks
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create index for faster page lookups
CREATE INDEX idx_page_blocks_page_slug ON public.page_blocks(page_slug);
CREATE INDEX idx_page_blocks_order ON public.page_blocks(page_slug, order_index);

-- Add trigger for updated_at
CREATE TRIGGER update_page_blocks_updated_at
  BEFORE UPDATE ON public.page_blocks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed demo page with sample blocks
INSERT INTO public.page_blocks (page_slug, block_type, block_config, order_index) VALUES
  ('demo', 'hero', '{"data_source": "hero_settings"}', 0),
  ('demo', 'text-section', '{"title": "Welcome to the Block Demo", "content": "This page demonstrates the flexible block-based CMS system. Each section you see is a configurable block that can be reordered, edited, or replaced.", "alignment": "center"}', 1),
  ('demo', 'expertise-grid', '{"data_source": "expertise_areas", "columns": 3}', 2),
  ('demo', 'image-text', '{"title": "Flexible Content Blocks", "content": "Create beautiful layouts by combining different block types. This image-text block supports left or right image positioning.", "image_position": "left", "image_url": "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800"}', 3),
  ('demo', 'cta-banner', '{"title": "Ready to get started?", "subtitle": "Contact me to discuss how we can work together.", "button_text": "Get in Touch", "button_url": "/chat", "style": "gradient"}', 4),
  ('demo', 'featured-carousel', '{"data_source": "featured_in"}', 5),
  ('demo', 'spacer', '{"height": "md"}', 6);