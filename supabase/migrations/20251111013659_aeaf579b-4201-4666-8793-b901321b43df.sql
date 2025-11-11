-- Temporarily allow public uploads to storage and writes to project_images for testing
-- WARNING: Not secure for production. Remove after testing.

-- 1) Storage policies for project-images bucket
create policy "Temporary: Public can upload to project-images"
on storage.objects
for insert
to public
with check (bucket_id = 'project-images');

create policy "Temporary: Public can update project-images"
on storage.objects
for update
to public
using (bucket_id = 'project-images')
with check (bucket_id = 'project-images');

create policy "Temporary: Public can delete project-images"
on storage.objects
for delete
to public
using (bucket_id = 'project-images');

-- 2) Allow public writes to project_images table
create policy "Temporary: Allow public writes on project_images"
on public.project_images
for all
to public
using (true)
with check (true);
