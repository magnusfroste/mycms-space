-- Create about_me_settings table
CREATE TABLE public.about_me_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Magnus Froste',
  intro_text TEXT NOT NULL DEFAULT 'As a seasoned technology leader and innovator, I''ve dedicated my career to helping organizations navigate the rapidly evolving tech landscape. My passion lies in identifying transformative opportunities at the intersection of business and technology.',
  additional_text TEXT NOT NULL DEFAULT 'With extensive experience in business and product development, I excel at turning complex ideas into tangible solutions. My approach combines strategic thinking with hands-on technical expertise, ensuring that innovation translates directly into business value.',
  skill1_title TEXT NOT NULL DEFAULT 'Technology Leadership',
  skill1_description TEXT NOT NULL DEFAULT 'Proven track record as CTO leading teams and implementing cutting-edge technology solutions loved by customers.',
  skill1_icon TEXT NOT NULL DEFAULT 'Monitor',
  skill2_title TEXT NOT NULL DEFAULT 'Product Strategy & Business Development',
  skill2_description TEXT NOT NULL DEFAULT '20+ years of experience from innovating new product & services and product management, driving successful market launches across different sectors.',
  skill2_icon TEXT NOT NULL DEFAULT 'Rocket',
  skill3_title TEXT NOT NULL DEFAULT 'AI Innovation',
  skill3_description TEXT NOT NULL DEFAULT 'Generative AI specialist with a wide range of experience developing AI Agents, RAG solutions, local AI deployments, generative AI libraries/packages, and more.',
  skill3_icon TEXT NOT NULL DEFAULT 'Brain',
  image_url TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.about_me_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read on about_me_settings" 
ON public.about_me_settings 
FOR SELECT 
USING (true);

-- Create policies for public write access (for admin)
CREATE POLICY "Allow public write on about_me_settings" 
ON public.about_me_settings 
FOR ALL 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_about_me_settings_updated_at
BEFORE UPDATE ON public.about_me_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial data
INSERT INTO public.about_me_settings (
  name, 
  intro_text, 
  additional_text,
  skill1_title,
  skill1_description,
  skill1_icon,
  skill2_title,
  skill2_description,
  skill2_icon,
  skill3_title,
  skill3_description,
  skill3_icon,
  image_url
) VALUES (
  'Magnus Froste',
  'As a seasoned technology leader and innovator, I''ve dedicated my career to helping organizations navigate the rapidly evolving tech landscape. My passion lies in identifying transformative opportunities at the intersection of business and technology.',
  'With extensive experience in business and product development, I excel at turning complex ideas into tangible solutions. My approach combines strategic thinking with hands-on technical expertise, ensuring that innovation translates directly into business value.',
  'Technology Leadership',
  'Proven track record as CTO leading teams and implementing cutting-edge technology solutions loved by customers.',
  'Monitor',
  'Product Strategy & Business Development',
  '20+ years of experience from innovating new product & services and product management, driving successful market launches across different sectors.',
  'Rocket',
  'AI Innovation',
  'Generative AI specialist with a wide range of experience developing AI Agents, RAG solutions, local AI deployments, generative AI libraries/packages, and more.',
  'Brain',
  ''
);