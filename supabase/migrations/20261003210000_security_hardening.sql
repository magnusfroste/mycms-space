-- ============================================================
-- Security hardening (2026-10-03)
--
-- Before: many policies were named "Authenticated …" but granted to the
-- `public` role with `true`, so anonymous visitors (with the public anon key)
-- could read contact messages, chat logs, agent memory and settings history,
-- and modify blog posts, pages, modules and newsletters. Signup is open, so
-- "authenticated" alone is not a trust boundary either.
--
-- After: an explicit admin list + is_admin(). Every table gets
--   * admin: full access
--   * public: read only where the site needs it
--   * public: insert/update only for the visitor flows (chat, contact,
--     newsletter signup, analytics)
-- Edge functions use the service role and are unaffected by RLS.
-- ============================================================

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;

-- Seed: every account that exists today (the site owner) becomes admin.
insert into public.admin_users (user_id)
select id from auth.users
on conflict do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists "Admins can see own admin row" on public.admin_users;
create policy "Admins can see own admin row" on public.admin_users
  for select to authenticated using (user_id = auth.uid());

-- Drop every existing policy on the hardened tables, then recreate explicitly.
do $$
declare r record;
begin
  for r in
    select schemaname, tablename, policyname from pg_policies
    where schemaname = 'public' and tablename = any (array['agent_activity','agent_automations','agent_memory','agent_objective_activities','agent_objectives','agent_skills','agent_tasks','blog_categories','blog_post_categories','blog_posts','chat_analytics','chat_messages','contact_messages','github_repo_images','github_repos','knowledge_doc_versions','knowledge_docs','mcp_activities','mcp_api_keys','modules','nav_links','newsletter_campaigns','newsletter_subscribers','page_blocks','page_views','pages','resume_entries','settings_history'])
  loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

alter table public.agent_activity enable row level security;
create policy "Admin full access" on public.agent_activity for all to authenticated using (public.is_admin()) with check (public.is_admin());
alter table public.agent_automations enable row level security;
create policy "Admin full access" on public.agent_automations for all to authenticated using (public.is_admin()) with check (public.is_admin());
alter table public.agent_memory enable row level security;
create policy "Admin full access" on public.agent_memory for all to authenticated using (public.is_admin()) with check (public.is_admin());
alter table public.agent_objective_activities enable row level security;
create policy "Admin full access" on public.agent_objective_activities for all to authenticated using (public.is_admin()) with check (public.is_admin());
alter table public.agent_objectives enable row level security;
create policy "Admin full access" on public.agent_objectives for all to authenticated using (public.is_admin()) with check (public.is_admin());
alter table public.agent_skills enable row level security;
create policy "Admin full access" on public.agent_skills for all to authenticated using (public.is_admin()) with check (public.is_admin());
alter table public.agent_tasks enable row level security;
create policy "Admin full access" on public.agent_tasks for all to authenticated using (public.is_admin()) with check (public.is_admin());
alter table public.blog_categories enable row level security;
create policy "Admin full access" on public.blog_categories for all to authenticated using (public.is_admin()) with check (public.is_admin());
alter table public.blog_post_categories enable row level security;
create policy "Admin full access" on public.blog_post_categories for all to authenticated using (public.is_admin()) with check (public.is_admin());
alter table public.blog_posts enable row level security;
create policy "Admin full access" on public.blog_posts for all to authenticated using (public.is_admin()) with check (public.is_admin());
alter table public.chat_analytics enable row level security;
create policy "Admin full access" on public.chat_analytics for all to authenticated using (public.is_admin()) with check (public.is_admin());
alter table public.chat_messages enable row level security;
create policy "Admin full access" on public.chat_messages for all to authenticated using (public.is_admin()) with check (public.is_admin());
alter table public.contact_messages enable row level security;
create policy "Admin full access" on public.contact_messages for all to authenticated using (public.is_admin()) with check (public.is_admin());
alter table public.github_repo_images enable row level security;
create policy "Admin full access" on public.github_repo_images for all to authenticated using (public.is_admin()) with check (public.is_admin());
alter table public.github_repos enable row level security;
create policy "Admin full access" on public.github_repos for all to authenticated using (public.is_admin()) with check (public.is_admin());
alter table public.knowledge_doc_versions enable row level security;
create policy "Admin full access" on public.knowledge_doc_versions for all to authenticated using (public.is_admin()) with check (public.is_admin());
alter table public.knowledge_docs enable row level security;
create policy "Admin full access" on public.knowledge_docs for all to authenticated using (public.is_admin()) with check (public.is_admin());
alter table public.mcp_activities enable row level security;
create policy "Admin full access" on public.mcp_activities for all to authenticated using (public.is_admin()) with check (public.is_admin());
alter table public.mcp_api_keys enable row level security;
create policy "Admin full access" on public.mcp_api_keys for all to authenticated using (public.is_admin()) with check (public.is_admin());
alter table public.modules enable row level security;
create policy "Admin full access" on public.modules for all to authenticated using (public.is_admin()) with check (public.is_admin());
alter table public.nav_links enable row level security;
create policy "Admin full access" on public.nav_links for all to authenticated using (public.is_admin()) with check (public.is_admin());
alter table public.newsletter_campaigns enable row level security;
create policy "Admin full access" on public.newsletter_campaigns for all to authenticated using (public.is_admin()) with check (public.is_admin());
alter table public.newsletter_subscribers enable row level security;
create policy "Admin full access" on public.newsletter_subscribers for all to authenticated using (public.is_admin()) with check (public.is_admin());
alter table public.page_blocks enable row level security;
create policy "Admin full access" on public.page_blocks for all to authenticated using (public.is_admin()) with check (public.is_admin());
alter table public.page_views enable row level security;
create policy "Admin full access" on public.page_views for all to authenticated using (public.is_admin()) with check (public.is_admin());
alter table public.pages enable row level security;
create policy "Admin full access" on public.pages for all to authenticated using (public.is_admin()) with check (public.is_admin());
alter table public.resume_entries enable row level security;
create policy "Admin full access" on public.resume_entries for all to authenticated using (public.is_admin()) with check (public.is_admin());
alter table public.settings_history enable row level security;
create policy "Admin full access" on public.settings_history for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Public read" on public.blog_categories for select to anon, authenticated using (enabled = true);
create policy "Public read" on public.blog_post_categories for select to anon, authenticated using (true);
create policy "Public read" on public.blog_posts for select to anon, authenticated using (status = 'published' and (published_at is null or published_at <= now()));
create policy "Public read" on public.github_repo_images for select to anon, authenticated using (true);
create policy "Public read" on public.github_repos for select to anon, authenticated using (enabled = true);
create policy "Public read" on public.knowledge_docs for select to anon, authenticated using (visibility = 'public');
create policy "Public read" on public.modules for select to anon, authenticated using (true);
create policy "Public read" on public.nav_links for select to anon, authenticated using (enabled = true);
create policy "Public read" on public.page_blocks for select to anon, authenticated using (enabled = true);
create policy "Public read" on public.pages for select to anon, authenticated using (enabled = true);
create policy "Public read" on public.resume_entries for select to anon, authenticated using (enabled = true);

create policy "Visitors can insert" on public.chat_analytics for insert to anon, authenticated with check (true);
create policy "Visitors can insert" on public.chat_messages for insert to anon, authenticated with check (true);
create policy "Visitors can insert" on public.contact_messages for insert to anon, authenticated with check (true);
create policy "Visitors can insert" on public.newsletter_subscribers for insert to anon, authenticated with check (true);
create policy "Visitors can insert" on public.page_views for insert to anon, authenticated with check (true);
create policy "Visitors can update" on public.chat_analytics for update to anon, authenticated using (true) with check (true);

-- Storage: public read for site images, admin-only writes.
do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname <> all (array['Service can manage agent documents', 'Service can manage cms files'])
  loop
    execute format('drop policy if exists %I on storage.objects', r.policyname);
  end loop;
end $$;

create policy "Public read site images" on storage.objects for select to anon, authenticated
  using (bucket_id in ('blog-images','featured-images','about-me-images','project-images','cms-files'));
create policy "Admin read all buckets" on storage.objects for select to authenticated
  using (public.is_admin());
create policy "Admin insert" on storage.objects for insert to authenticated
  with check (public.is_admin() and bucket_id in ('blog-images','featured-images','about-me-images','project-images','cms-files','agent-documents'));
create policy "Admin update" on storage.objects for update to authenticated
  using (public.is_admin() and bucket_id in ('blog-images','featured-images','about-me-images','project-images','cms-files','agent-documents'));
create policy "Admin delete" on storage.objects for delete to authenticated
  using (public.is_admin() and bucket_id in ('blog-images','featured-images','about-me-images','project-images','cms-files','agent-documents'));
