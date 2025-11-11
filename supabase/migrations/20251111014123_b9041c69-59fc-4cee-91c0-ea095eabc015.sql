-- Remove conflicting authenticated-only policies and ensure clean public access for testing
-- WARNING: Not secure for production

-- Drop old authenticated-only INSERT policy that might be conflicting
DROP POLICY IF EXISTS "Authenticated users can upload project images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete project images" ON storage.objects;

-- Recreate public policies with explicit names
DROP POLICY IF EXISTS "Temporary: Public can upload to project-images" ON storage.objects;
DROP POLICY IF EXISTS "Temporary: Public can update project-images" ON storage.objects;
DROP POLICY IF EXISTS "Temporary: Public can delete project-images" ON storage.objects;

-- Create simple public policies for all operations
CREATE POLICY "Public upload project-images"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'project-images');

CREATE POLICY "Public update project-images"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'project-images')
WITH CHECK (bucket_id = 'project-images');

CREATE POLICY "Public delete project-images"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'project-images');