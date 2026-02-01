-- ============================================
-- Blog Module: Database Setup
-- ============================================

-- 1. Create blog_posts table
CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL DEFAULT '',
  cover_image_url TEXT,
  cover_image_path TEXT,
  author_name TEXT DEFAULT 'Admin',
  author_avatar_url TEXT,
  reading_time_minutes INTEGER DEFAULT 1,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled')),
  published_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ,
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT[],
  featured BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create blog_categories table
CREATE TABLE public.blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create junction table for many-to-many relationship
CREATE TABLE public.blog_post_categories (
  post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.blog_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, category_id)
);

-- 4. Enable RLS on all tables
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_categories ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for blog_posts
CREATE POLICY "Public can view published posts"
ON public.blog_posts
FOR SELECT
USING (status = 'published' AND (published_at IS NULL OR published_at <= now()));

CREATE POLICY "Authenticated can manage all posts"
ON public.blog_posts
FOR ALL
USING (true)
WITH CHECK (true);

-- 6. RLS Policies for blog_categories
CREATE POLICY "Public can view enabled categories"
ON public.blog_categories
FOR SELECT
USING (enabled = true);

CREATE POLICY "Authenticated can manage categories"
ON public.blog_categories
FOR ALL
USING (true)
WITH CHECK (true);

-- 7. RLS Policies for blog_post_categories
CREATE POLICY "Public can view post categories"
ON public.blog_post_categories
FOR SELECT
USING (true);

CREATE POLICY "Authenticated can manage post categories"
ON public.blog_post_categories
FOR ALL
USING (true)
WITH CHECK (true);

-- 8. Create updated_at trigger for blog_posts
CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Create indexes for performance
CREATE INDEX idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX idx_blog_posts_published_at ON public.blog_posts(published_at);
CREATE INDEX idx_blog_posts_featured ON public.blog_posts(featured);
CREATE INDEX idx_blog_categories_slug ON public.blog_categories(slug);

-- 10. Enable realtime for blog_posts
ALTER PUBLICATION supabase_realtime ADD TABLE public.blog_posts;

-- 11. Create storage bucket for blog images
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true);

-- 12. Storage policies for blog-images bucket
CREATE POLICY "Blog images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'blog-images');

CREATE POLICY "Authenticated can upload blog images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'blog-images');

CREATE POLICY "Authenticated can update blog images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'blog-images');

CREATE POLICY "Authenticated can delete blog images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'blog-images');

-- 13. Add blog module to modules table
INSERT INTO public.modules (module_type, module_config, enabled)
VALUES (
  'blog',
  '{
    "posts_per_page": 10,
    "show_reading_time": true,
    "show_author": true,
    "show_categories": true,
    "default_cover_image": "",
    "enable_comments": false,
    "date_format": "MMMM d, yyyy"
  }'::jsonb,
  true
);

-- 14. Add settings history trigger for blog_posts
CREATE TRIGGER log_blog_posts_changes
BEFORE UPDATE OR DELETE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.log_settings_change();