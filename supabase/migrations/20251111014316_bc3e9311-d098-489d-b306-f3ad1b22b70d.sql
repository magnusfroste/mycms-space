-- Restore secure authentication-only policies now that proper auth is implemented
-- Remove temporary public access policies and restore authenticated-only access

-- 1. Drop ALL existing policies and recreate clean authenticated-only policies

-- Drop policies on projects table
DROP POLICY IF EXISTS "Temporary: Allow public writes on projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can manage projects" ON public.projects;

-- Drop policies on project_images table
DROP POLICY IF EXISTS "Temporary: Allow public writes on project_images" ON public.project_images;
DROP POLICY IF EXISTS "Authenticated users can manage project images" ON public.project_images;

-- Drop policies on storage
DROP POLICY IF EXISTS "Public upload project-images" ON storage.objects;
DROP POLICY IF EXISTS "Public update project-images" ON storage.objects;
DROP POLICY IF EXISTS "Public delete project-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload project images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update project images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete project images" ON storage.objects;

-- 2. Create authenticated-only policies for projects table
-- (Public can still view via existing "Public can view enabled projects" policy)
CREATE POLICY "Authenticated users can manage projects"
ON public.projects
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 3. Create authenticated-only policies for project_images table
-- (Public can still view via existing "Public can view project images" policy)
CREATE POLICY "Authenticated users can manage project images"
ON public.project_images
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Create authenticated-only policies for storage
CREATE POLICY "Authenticated users can upload project images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'project-images');

CREATE POLICY "Authenticated users can update project images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'project-images')
WITH CHECK (bucket_id = 'project-images');

CREATE POLICY "Authenticated users can delete project images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'project-images');