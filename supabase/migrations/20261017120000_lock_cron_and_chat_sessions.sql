-- Säkerhet (sweep 2026-10-17): alter_cron_job och get_cron_jobs var SECURITY DEFINER och
-- anropsbara av anonyma besökare – vem som helst kunde läsa cron-kommandon och stänga av
-- eller ändra schemat för jobben. Bara edge-funktionen agent-autopilot (service role) använder dem.
revoke all on function public.alter_cron_job(text,text,boolean) from public, anon, authenticated;
grant execute on function public.alter_cron_job(text,text,boolean) to service_role;
revoke all on function public.get_cron_jobs() from public, anon, authenticated;
grant execute on function public.get_cron_jobs() to service_role;

-- get_chat_sessions kringgick RLS på chat_messages (bara admin får läsa) och visade alla
-- besökares chattar för vem som helst. Nu returnerar den rader bara för admin/service role.
CREATE OR REPLACE FUNCTION public.get_chat_sessions(p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
 RETURNS TABLE(session_id text, first_message text, message_count bigint, started_at timestamp with time zone, last_message_at timestamp with time zone)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT cm.session_id,
    COALESCE((SELECT content FROM chat_messages cm2 WHERE cm2.session_id = cm.session_id AND cm2.role = 'user' ORDER BY cm2.created_at ASC LIMIT 1), 'No message') AS first_message,
    COUNT(*) AS message_count, MIN(cm.created_at) AS started_at, MAX(cm.created_at) AS last_message_at
  FROM chat_messages cm
  WHERE public.is_admin() OR auth.role() = 'service_role'
  GROUP BY cm.session_id
  ORDER BY last_message_at DESC
  LIMIT p_limit OFFSET p_offset;
$function$;
revoke all on function public.get_chat_sessions(integer,integer) from public, anon;
grant execute on function public.get_chat_sessions(integer,integer) to authenticated, service_role;
