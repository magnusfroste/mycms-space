-- The consent page shows where an OAuth approval sends the access: the
-- redirect URI of the pending authorization. getAuthorizationDetails does not
-- always return it, and anyone can register a client with any name, so the
-- admin needs the real destination to spot a fake "Claude".
create or replace function public.oauth_request_info(p_authorization_id text)
returns table (redirect_uri text, registration_type text, client_created_at timestamptz)
language sql
stable
security definer
set search_path = public, auth
as $$
  select a.redirect_uri, c.registration_type::text, c.created_at
  from auth.oauth_authorizations a
  join auth.oauth_clients c on c.id = a.client_id
  where a.authorization_id = p_authorization_id
    and public.is_admin();
$$;
revoke all on function public.oauth_request_info(text) from public, anon;
grant execute on function public.oauth_request_info(text) to authenticated;
