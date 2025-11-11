-- Add image_path column to about_me_settings
ALTER TABLE public.about_me_settings 
ADD COLUMN IF NOT EXISTS image_path text;

-- Create storage bucket for about me images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('about-me-images', 'about-me-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for about me images
DROP POLICY IF EXISTS "Public can view about me images" ON storage.objects;
CREATE POLICY "Public can view about me images"
ON storage.objects FOR SELECT
USING (bucket_id = 'about-me-images');

DROP POLICY IF EXISTS "Authenticated users can upload about me images" ON storage.objects;
CREATE POLICY "Authenticated users can upload about me images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'about-me-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update about me images" ON storage.objects;
CREATE POLICY "Authenticated users can update about me images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'about-me-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete about me images" ON storage.objects;
CREATE POLICY "Authenticated users can delete about me images"
ON storage.objects FOR DELETE
USING (bucket_id = 'about-me-images' AND auth.role() = 'authenticated');