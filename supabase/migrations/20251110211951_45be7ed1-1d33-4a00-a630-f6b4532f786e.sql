-- Create expertise_areas table
CREATE TABLE public.expertise_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT 'Lightbulb',
  order_index integer NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expertise_areas ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow public read on expertise_areas"
  ON public.expertise_areas
  FOR SELECT
  TO public
  USING (enabled = true);

CREATE POLICY "Allow public write on expertise_areas"
  ON public.expertise_areas
  FOR ALL
  TO public
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_expertise_areas_updated_at
  BEFORE UPDATE ON public.expertise_areas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed data from fallback
INSERT INTO public.expertise_areas (title, description, icon, order_index)
VALUES 
  ('AI Integration', 'Helping organizations leverage AI to transform their operations and create competitive advantages.', 'Brain', 1),
  ('Digital Strategy', 'Crafting comprehensive digital transformation strategies that drive measurable business outcomes.', 'Rocket', 2),
  ('Innovation Consulting', 'Guiding teams through the innovation process from ideation to successful market implementation.', 'Lightbulb', 3);