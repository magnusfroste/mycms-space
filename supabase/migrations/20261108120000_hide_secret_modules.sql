-- Säkerhet: modules-rader med hemligheter ska inte vara publikt läsbara.
--
-- "Public read" var using (true), så anon-nyckeln kunde läsa Gmail OAuth-tokens
-- (gmail_signals) och API-nycklar (api_tokens). Övriga moduler behövs av den
-- publika sajten och förblir läsbara. Admin läser allt via "Admin full access".
--
-- Redan applicerad i produktion 2026-11-08; idempotent.

drop policy if exists "Public read" on public.modules;
create policy "Public read" on public.modules
  for select to anon, authenticated
  using (module_type not in ('api_tokens', 'gmail_signals'));
