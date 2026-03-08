-- Create general CMS files bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('cms-files', 'cms-files', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: Authenticated users can upload
CREATE POLICY "Authenticated can upload cms files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'cms-files');

-- RLS: Anyone can read (public bucket)
CREATE POLICY "Anyone can read cms files"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'cms-files');

-- RLS: Authenticated can update
CREATE POLICY "Authenticated can update cms files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'cms-files');

-- RLS: Authenticated can delete
CREATE POLICY "Authenticated can delete cms files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'cms-files');

-- RLS: Service role full access
CREATE POLICY "Service can manage cms files"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'cms-files')
WITH CHECK (bucket_id = 'cms-files');