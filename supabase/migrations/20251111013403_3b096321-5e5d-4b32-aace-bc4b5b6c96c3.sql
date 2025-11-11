-- Temporarily allow public writes to projects table for testing
-- WARNING: This is NOT secure for production use

CREATE POLICY "Temporary: Allow public writes on projects"
ON public.projects
FOR ALL
TO public
USING (true)
WITH CHECK (true);