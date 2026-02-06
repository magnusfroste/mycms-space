-- Add readme_content column to github_repos table
ALTER TABLE public.github_repos 
ADD COLUMN readme_content TEXT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.github_repos.readme_content IS 'Cached README.md content from GitHub repository';