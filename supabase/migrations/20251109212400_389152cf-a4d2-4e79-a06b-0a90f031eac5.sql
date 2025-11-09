-- Create hero_settings table
CREATE TABLE public.hero_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL DEFAULT 'Magnus Froste',
  tagline text NOT NULL DEFAULT 'Innovation Strategist & AI Integration Expert',
  feature1 text NOT NULL DEFAULT 'Innovation',
  feature1_icon text NOT NULL DEFAULT 'Rocket',
  feature2 text NOT NULL DEFAULT 'Strategy',
  feature2_icon text NOT NULL DEFAULT 'BarChart',
  feature3 text NOT NULL DEFAULT 'AI Integration',
  feature3_icon text NOT NULL DEFAULT 'Brain',
  enable_animations boolean NOT NULL DEFAULT true,
  animation_style text NOT NULL DEFAULT 'falling-stars',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.hero_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read on hero_settings" 
ON public.hero_settings 
FOR SELECT 
USING (true);

-- Create policy for public write access (for admin functionality)
CREATE POLICY "Allow public write on hero_settings" 
ON public.hero_settings 
FOR ALL 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_hero_settings_updated_at
BEFORE UPDATE ON public.hero_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial data
INSERT INTO public.hero_settings (
  name,
  tagline,
  feature1,
  feature1_icon,
  feature2,
  feature2_icon,
  feature3,
  feature3_icon,
  enable_animations,
  animation_style
) VALUES (
  'Magnus Froste',
  'Innovation Strategist & AI Integration Expert',
  'Innovation',
  'Rocket',
  'Strategy',
  'BarChart',
  'AI Integration',
  'Brain',
  true,
  'falling-stars'
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.hero_settings;