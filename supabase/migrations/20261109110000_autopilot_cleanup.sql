-- Autopilot: städning av granskningskön (beslutad av ägaren 2026-11-09).
-- Engångsstädning; redan körd i produktion. Idempotent.
--
-- Före: 229 väntande (196 blogg, 33 nyhetsbrev), 253 misslyckade körningar.
-- 188 av blogg-utkasten pekade på inlägg som inte längre fanns.

-- 1. Blogg-utkast vars inlägg inte längre finns.
update public.agent_tasks t
set status = 'rejected', completed_at = now(),
    output_data = t.output_data || '{"decision":"expired","decision_note":"Inlägget fanns inte längre"}'::jsonb
where t.task_type = 'blog_draft' and t.status = 'needs_review'
  and not exists (select 1 from public.blog_posts p where p.id::text = t.output_data->>'blog_post_id');

-- 2. Blogg-utkast äldre än 14 dagar: inlägget arkiveras (kan återställas).
update public.blog_posts p
set status = 'archived'
from public.agent_tasks t
where t.task_type = 'blog_draft' and t.status = 'needs_review'
  and t.created_at < now() - interval '14 days'
  and p.id::text = t.output_data->>'blog_post_id' and p.status = 'draft';

update public.agent_tasks t
set status = 'rejected', completed_at = now(),
    output_data = t.output_data || '{"decision":"expired","decision_note":"Äldre än 14 dagar – inlägget arkiverat"}'::jsonb
where t.task_type = 'blog_draft' and t.status = 'needs_review'
  and t.created_at < now() - interval '14 days';

-- 3. Nyhetsbrevsutkast äldre än 14 dagar: innehållet sparas i uppgiften,
--    sedan tas det aldrig skickade utkastet bort.
update public.agent_tasks t
set status = 'rejected', completed_at = now(),
    output_data = t.output_data
      || jsonb_build_object('archived_campaign', to_jsonb(c))
      || '{"decision":"expired","decision_note":"Äldre än 14 dagar – utkastet arkiverat i uppgiften"}'::jsonb
from public.newsletter_campaigns c
where t.task_type = 'newsletter_draft' and t.status = 'needs_review'
  and t.created_at < now() - interval '14 days'
  and c.id::text = t.output_data->>'campaign_id' and c.status = 'draft';

delete from public.newsletter_campaigns c
using public.agent_tasks t
where t.task_type = 'newsletter_draft' and t.status = 'rejected'
  and t.output_data ? 'archived_campaign'
  and c.id::text = t.output_data->>'campaign_id' and c.status = 'draft';

-- 4. Misslyckade körningar äldre än 7 dagar (240 av dem var samma Gmail-fel).
delete from public.agent_tasks
where status = 'failed' and created_at < now() - interval '7 days';

-- 5. Felkopplade automationer av tills de är omgjorda:
--    autosvaret körde draft_all_channels (blogg/social), välkomstutskicket
--    skapade ett nyhetsbrevsutkast per prenumerant, digest saknade schema.
update public.agent_automations
set enabled = false
where name in ('Auto-reply contact messages', 'Welcome new subscribers', 'Weekly Digest Automation');

-- 6. Skyddens standardvärden synliga och ändringsbara (settings_update via MCP).
update public.modules
set module_config = '{"max_waiting_reviews": 5, "draft_expiry_days": 14}'::jsonb || module_config
where module_type = 'autopilot';

-- 7. Gmail-kopplingen gav invalid_grant varje dag sedan mars: markera att den
--    måste kopplas om; inkorgsskanningen hoppar då över tills den är omkopplad.
update public.modules
set module_config = module_config || '{"needs_reconnect": true}'::jsonb
where module_type = 'gmail_signals' and module_config->>'connected' = 'true';
