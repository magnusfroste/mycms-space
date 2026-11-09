-- Integritet: block på avpublicerade sidor var fortfarande publikt läsbara.
-- Sidan /resume var avstängd men dess aktiverade textblock (rått CV med
-- telefon, e-post och familjeuppgifter) gick att hämta via REST.
-- Redan applicerad i produktion 2026-11-09.

-- 1. Publik läsning bara av block på publicerade sidor (block utan sidrad,
--    t.ex. globala block, påverkas inte).
drop policy if exists "Public read" on public.page_blocks;
create policy "Public read" on public.page_blocks for select to anon, authenticated
  using (
    enabled = true
    and not exists (select 1 from public.pages p where p.slug = page_blocks.page_slug and p.enabled = false)
  );

-- 2. Sidan /resume och avstängda block av typer som inte längre finns i
--    koden tas bort; innehållet sparas först i settings_history (admin).
insert into public.settings_history (table_name, record_id, old_data, changed_by)
select 'page_blocks', id, to_jsonb(b), 'migration: removed (unpublished /resume page / retired block type)'
from public.page_blocks b
where b.page_slug = 'resume'
   or b.block_type in ('about-split','cv-agent','featured-carousel','parallax-section','skills-bar','values',
                       'hero','chat-widget','project-showcase','image-text','spacer','video-hero','bento-grid',
                       'marquee','stats-counter','testimonial-carousel','newsletter-subscribe','agent-status');
insert into public.settings_history (table_name, record_id, old_data, changed_by)
select 'pages', id, to_jsonb(p), 'migration: removed unpublished /resume page' from public.pages p where p.slug = 'resume';

delete from public.page_blocks
where page_slug = 'resume'
   or block_type in ('about-split','cv-agent','featured-carousel','parallax-section','skills-bar','values',
                     'hero','chat-widget','project-showcase','image-text','spacer','video-hero','bento-grid',
                     'marquee','stats-counter','testimonial-carousel','newsletter-subscribe','agent-status');
delete from public.pages where slug = 'resume';
