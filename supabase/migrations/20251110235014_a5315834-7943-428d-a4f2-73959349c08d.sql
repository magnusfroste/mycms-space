-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  order_index INTEGER NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_categories junction table
CREATE TABLE public.project_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, category_id)
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories
CREATE POLICY "Public can view enabled categories" 
ON public.categories 
FOR SELECT 
USING (enabled = true);

CREATE POLICY "Allow public write on categories" 
ON public.categories 
FOR ALL 
USING (true);

-- RLS Policies for project_categories
CREATE POLICY "Public can view project categories" 
ON public.project_categories 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_categories.project_id 
    AND projects.enabled = true
  )
  AND EXISTS (
    SELECT 1 FROM public.categories 
    WHERE categories.id = project_categories.category_id 
    AND categories.enabled = true
  )
);

CREATE POLICY "Allow public write on project_categories" 
ON public.project_categories 
FOR ALL 
USING (true);

-- Create trigger for categories updated_at
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default categories
INSERT INTO public.categories (name, slug, order_index) VALUES
  ('AI & Machine Learning', 'ai-ml', 1),
  ('Business Tools', 'business', 2),
  ('Healthcare', 'healthcare', 3),
  ('Analytics', 'analytics', 4),
  ('Education', 'education', 5),
  ('Productivity', 'productivity', 6);