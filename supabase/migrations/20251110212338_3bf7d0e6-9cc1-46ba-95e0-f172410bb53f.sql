-- Create storage bucket for featured images
INSERT INTO storage.buckets (id, name, public)
VALUES ('featured-images', 'featured-images', true);

-- RLS Policy: Allow public read access to images
CREATE POLICY "Public can view featured images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'featured-images');

-- RLS Policy: Allow all users to upload (we'll rely on app-level security for now)
CREATE POLICY "Allow public upload featured images"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'featured-images');

-- RLS Policy: Allow all users to delete
CREATE POLICY "Allow public delete featured images"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'featured-images');