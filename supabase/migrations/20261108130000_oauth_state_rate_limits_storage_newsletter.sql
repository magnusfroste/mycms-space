-- ============================================
-- Security hardening, part 2
-- 1. oauth_states: one-time OAuth state for the Gmail connect flow
-- 2. rate_limits + hit_rate_limit(): per-IP limits for public AI endpoints
-- 3. cms-files: no anonymous listing (public URLs keep working)
-- 4. newsletter_subscribers: visitor sign-ups start as 'pending'
-- ============================================

-- 1. OAuth state (service role only)
create table if not exists public.oauth_states (
  state text primary key,
  provider text not null default 'gmail',
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.oauth_states enable row level security;
revoke all on public.oauth_states from anon, authenticated;
grant all on public.oauth_states to service_role;

-- 2. Rate limiting (service role only, through hit_rate_limit)
create table if not exists public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  count int not null default 0,
  primary key (key, window_start)
);
alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from anon, authenticated;
grant all on public.rate_limits to service_role;

-- Counts one hit for p_key in the current fixed window and returns true
-- while the caller is within p_max hits per p_window_seconds.
create or replace function public.hit_rate_limit(p_key text, p_window_seconds int, p_max int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window timestamptz :=
    to_timestamp(floor(extract(epoch from now()) / greatest(p_window_seconds, 1)) * greatest(p_window_seconds, 1));
  v_count int;
begin
  insert into public.rate_limits as r (key, window_start, count)
  values (p_key, v_window, 1)
  on conflict (key, window_start) do update set count = r.count + 1
  returning r.count into v_count;

  -- Occasional cleanup of old windows.
  if random() < 0.01 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;

  return v_count <= p_max;
end;
$$;
revoke all on function public.hit_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, int, int) to service_role;

-- 3. Storage: cms-files holds admin uploads and generated CVs/cover letters.
-- The bucket stays public so existing public URLs (/object/public/...) keep
-- working — those bypass RLS — but visitors can no longer list its contents.
-- Admins still list everything via "Admin read all buckets".
drop policy if exists "Public read site images" on storage.objects;
create policy "Public read site images" on storage.objects for select to anon, authenticated
  using (bucket_id in ('blog-images','featured-images','about-me-images','project-images'));

-- 4. Newsletter: visitors may only create pending subscriptions. send-newsletter
-- only mails 'active' subscribers; an admin activates pending ones.
alter table public.newsletter_subscribers drop constraint if exists newsletter_subscribers_status_check;
alter table public.newsletter_subscribers add constraint newsletter_subscribers_status_check
  check (status in ('pending', 'active', 'unsubscribed', 'bounced'));
alter table public.newsletter_subscribers alter column status set default 'pending';

drop policy if exists "Visitors can insert" on public.newsletter_subscribers;
create policy "Visitors can insert" on public.newsletter_subscribers for insert to anon, authenticated
  with check (status = 'pending' and unsubscribed_at is null);
