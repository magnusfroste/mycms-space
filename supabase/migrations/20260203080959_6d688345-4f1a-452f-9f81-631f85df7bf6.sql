-- ============================================
-- GitHub Repos Table
-- Stores synced GitHub repos with enrichment
-- ============================================

-- Table for synced GitHub repositories
CREATE TABLE public.github_repos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  github_id TEXT NOT NULL UNIQUE, -- GitHub's numeric ID as string
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  homepage TEXT,
  language TEXT,
  stars INTEGER DEFAULT 0,
  forks INTEGER DEFAULT 0,
  topics TEXT[] DEFAULT '{}',
  pushed_at TIMESTAMP WITH TIME ZONE,
  created_at_github TIMESTAMP WITH TIME ZONE,
  is_fork BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  
  -- Enrichment fields (user-provided content)
  enriched_title TEXT,  -- Override title
  enriched_description TEXT,  -- Rich description (markdown)
  problem_statement TEXT,  -- What problem does it solve?
  why_it_matters TEXT,  -- Why was it built?
  
  -- Visibility and ordering
  enabled BOOLEAN DEFAULT false,  -- Only enabled repos are shown
  order_index INTEGER DEFAULT 0,
  
  -- Sync metadata
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for enrichment images (carousel)
CREATE TABLE public.github_repo_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  repo_id UUID NOT NULL REFERENCES public.github_repos(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_path TEXT,  -- Storage path for deletion
  alt_text TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.github_repos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.github_repo_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for github_repos
CREATE POLICY "Public can view enabled repos"
ON public.github_repos
FOR SELECT
USING (enabled = true);

CREATE POLICY "Authenticated can manage all repos"
ON public.github_repos
FOR ALL
USING (true)
WITH CHECK (true);

-- RLS Policies for github_repo_images
CREATE POLICY "Public can view repo images"
ON public.github_repo_images
FOR SELECT
USING (true);

CREATE POLICY "Authenticated can manage repo images"
ON public.github_repo_images
FOR ALL
USING (true)
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_github_repos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_github_repos_updated_at
BEFORE UPDATE ON public.github_repos
FOR EACH ROW
EXECUTE FUNCTION public.update_github_repos_updated_at();

-- Index for common queries
CREATE INDEX idx_github_repos_enabled ON public.github_repos(enabled, order_index);
CREATE INDEX idx_github_repos_github_id ON public.github_repos(github_id);
CREATE INDEX idx_github_repo_images_repo_id ON public.github_repo_images(repo_id, order_index);