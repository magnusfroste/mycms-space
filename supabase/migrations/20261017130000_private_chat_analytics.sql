-- chat_analytics kunde läsas och ändras av alla. Besökare skapar sin rad
-- (klientgenererat id) och uppdaterar den via update_chat_session; bara
-- admin läser. Policyerna för besökarläsning/-uppdatering tas bort efter
-- att klienten som använder RPC:n publicerats.
create or replace function public.update_chat_session(p_id uuid, p_message_count integer)
returns void language sql security definer set search_path = public as $$
  update public.chat_analytics
     set message_count = greatest(0, least(p_message_count, 10000)), session_end = now()
   where id = p_id and created_at > now() - interval '1 day'
$$;
revoke execute on function public.update_chat_session(uuid, integer) from public;
grant execute on function public.update_chat_session(uuid, integer) to anon, authenticated;

drop policy if exists "Visitors can read chat analytics" on public.chat_analytics;
drop policy if exists "Visitors can update" on public.chat_analytics;
