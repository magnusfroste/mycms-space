-- Visitors only need the modules that render the site. Autopilot's settings
-- (editorial brief, publishing policy) are internal; admins keep full access.
drop policy if exists "Public read" on public.modules;
create policy "Public read" on public.modules
  for select to anon, authenticated
  using (module_type <> all (array['api_tokens', 'autopilot']));
