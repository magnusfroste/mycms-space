-- Create featured_in table
CREATE TABLE public.featured_in (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  image_url text,
  image_path text,
  order_index integer NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.featured_in ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Public can view enabled items
CREATE POLICY "Public can view enabled featured items"
ON public.featured_in FOR SELECT
TO public
USING (enabled = true);

-- RLS Policy: Allow public write access (similar to other settings tables)
CREATE POLICY "Allow public write on featured_in"
ON public.featured_in FOR ALL
TO public
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_featured_in_updated_at
  BEFORE UPDATE ON public.featured_in
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed data with existing fallback images
INSERT INTO public.featured_in (title, description, image_url, order_index)
VALUES 
  ('Innovation Panel', 'Expert panel on driving innovation in traditional industries', '/lovable-uploads/28138354-db3a-4afd-ba4b-aa3f24fd056c.png', 1),
  ('Tech Conference', 'Keynote speaker at a leading technology conference', '/lovable-uploads/76c280cc-900a-4d28-b7cc-e52a7f4793b7.png', 2),
  ('AI Symposium', 'Featured speaker discussing the future of AI in business', '/lovable-uploads/19c8a77f-19ca-4427-ae8a-b07a6070c2c0.png', 3);