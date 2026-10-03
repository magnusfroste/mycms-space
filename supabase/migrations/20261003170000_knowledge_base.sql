-- Knowledge base: replaces the structured resume module with markdown documents
-- that any agent can maintain via MCP and that ground the chat.

create table if not exists public.knowledge_docs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  content text not null default '',
  visibility text not null default 'private' check (visibility in ('public', 'private')),
  order_index integer not null default 0,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.knowledge_doc_versions (
  id uuid primary key default gen_random_uuid(),
  doc_id uuid,
  slug text not null,
  title text not null,
  content text not null,
  visibility text not null,
  change_type text not null,
  changed_by text,
  created_at timestamptz not null default now()
);
create index if not exists knowledge_doc_versions_doc_idx on public.knowledge_doc_versions (doc_id, created_at desc);

-- Keep the previous state on every update/delete so any agent write can be undone.
create or replace function public.knowledge_docs_history()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' then
    if old.content is distinct from new.content or old.title is distinct from new.title or old.visibility is distinct from new.visibility then
      insert into knowledge_doc_versions (doc_id, slug, title, content, visibility, change_type, changed_by)
      values (old.id, old.slug, old.title, old.content, old.visibility, 'update', new.updated_by);
    end if;
    new.updated_at := now();
    return new;
  elsif tg_op = 'DELETE' then
    insert into knowledge_doc_versions (doc_id, slug, title, content, visibility, change_type, changed_by)
    values (old.id, old.slug, old.title, old.content, old.visibility, 'delete', old.updated_by);
    return old;
  end if;
  return null;
end $$;

drop trigger if exists knowledge_docs_history_upd on public.knowledge_docs;
create trigger knowledge_docs_history_upd before update on public.knowledge_docs
  for each row execute function public.knowledge_docs_history();
drop trigger if exists knowledge_docs_history_del on public.knowledge_docs;
create trigger knowledge_docs_history_del before delete on public.knowledge_docs
  for each row execute function public.knowledge_docs_history();

alter table public.knowledge_docs enable row level security;
alter table public.knowledge_doc_versions enable row level security;

drop policy if exists "Public can read public knowledge docs" on public.knowledge_docs;
create policy "Public can read public knowledge docs" on public.knowledge_docs
  for select using (visibility = 'public');
drop policy if exists "Authenticated can manage knowledge docs" on public.knowledge_docs;
create policy "Authenticated can manage knowledge docs" on public.knowledge_docs
  for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated can read knowledge history" on public.knowledge_doc_versions;
create policy "Authenticated can read knowledge history" on public.knowledge_doc_versions
  for select to authenticated using (true);
