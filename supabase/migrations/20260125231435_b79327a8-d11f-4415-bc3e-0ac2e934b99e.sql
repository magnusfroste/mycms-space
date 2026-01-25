-- Drop existing restrictive SELECT policy
DROP POLICY IF EXISTS "Public can view enabled projects" ON public.projects;

-- Create new SELECT policy: authenticated users see all, public sees only enabled
CREATE POLICY "Anyone can view projects based on auth status"
ON public.projects
FOR SELECT
USING (
  CASE 
    WHEN auth.role() = 'authenticated' THEN true
    ELSE enabled = true
  END
);