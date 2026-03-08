-- Create storage bucket for agent documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('agent-documents', 'agent-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: Authenticated users can upload
CREATE POLICY "Authenticated can upload agent documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'agent-documents');

-- RLS: Authenticated users can read
CREATE POLICY "Authenticated can read agent documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'agent-documents');

-- RLS: Anyone can upload (for public chat file uploads)
CREATE POLICY "Anyone can upload agent documents"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'agent-documents');

-- RLS: Service role can manage all
CREATE POLICY "Service can manage agent documents"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'agent-documents')
WITH CHECK (bucket_id = 'agent-documents');