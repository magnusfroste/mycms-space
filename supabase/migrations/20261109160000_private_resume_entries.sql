-- Integritet: den gamla tabellen resume_entries (ersatt av kunskapsbasen)
-- var publikt läsbar och innehöll personuppgifter (familj, bostadsområde).
-- Bara serverfunktioner (service role) läser den, som reserv när
-- kunskapsbasen är tom. Redan applicerad i produktion 2026-11-09.

drop policy if exists "Public read" on public.resume_entries;

-- Profilhuvudet (resume-modulen) är publikt läsbart och grundar chatten:
-- visa stad, inte stadsdel.
update public.modules
set module_config = jsonb_set(module_config, '{owner_location}', '"Stockholm, Sweden"')
where module_type = 'resume' and module_config->>'owner_location' ilike '%kungsholmen%';
