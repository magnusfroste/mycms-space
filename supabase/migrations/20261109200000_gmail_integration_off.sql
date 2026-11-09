-- Gmail-integrationen var ett test och stängs av (ägarens beslut 2026-11-09).
-- Modulen stängs av och de sparade OAuth-tokens tas bort; den dagliga
-- inkorgsskanningen pausas. Koden finns kvar och kan kopplas in igen från
-- admin → Integrations. Redan applicerad i produktion.

update public.modules
set enabled = false, module_config = '{"connected": false}'::jsonb
where module_type = 'gmail_signals';

select cron.alter_job(jobid, active := false)
from cron.job
where jobname = 'daily-inbox-scan';
