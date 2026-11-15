-- Retired integrations: Gmail signals, the webhooks module and the Chrome
-- extension bridge. Their code is removed; this removes their data.

-- Gmail: the module row holds OAuth tokens, so it is deleted, not archived.
delete from public.modules where module_type in ('gmail_signals', 'webhooks', 'chrome_extension');
drop table if exists public.oauth_states;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'daily-inbox-scan') then
    perform cron.unschedule('daily-inbox-scan');
  end if;
end $$;
