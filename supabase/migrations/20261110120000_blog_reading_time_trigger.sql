-- Reading time is computed in the database, so every writer gets it right:
-- the admin editor, Autopilot and MCP (blog_upsert). Autopilot never set it,
-- so its posts showed "1 min" for 1 000 words. About 200 words per minute.
create or replace function public.blog_posts_reading_time()
returns trigger
language plpgsql
as $$
begin
  new.reading_time_minutes := greatest(
    1,
    round(coalesce(array_length(regexp_split_to_array(trim(coalesce(new.content, '')), '\s+'), 1), 0) / 200.0)
  )::int;
  return new;
end;
$$;

drop trigger if exists blog_posts_reading_time on public.blog_posts;
create trigger blog_posts_reading_time
  before insert or update of content on public.blog_posts
  for each row execute function public.blog_posts_reading_time();

-- Backfill without touching content (keeps updated_at as it is)
update public.blog_posts
set reading_time_minutes = greatest(
  1,
  round(coalesce(array_length(regexp_split_to_array(trim(coalesce(content, '')), '\s+'), 1), 0) / 200.0)
)::int
where reading_time_minutes is distinct from greatest(
  1,
  round(coalesce(array_length(regexp_split_to_array(trim(coalesce(content, '')), '\s+'), 1), 0) / 200.0)
)::int;
