-- Kunskapsbasen (knowledge_docs) har ersatt resume_entries som källa för chatten.
-- De gamla resume-skillsen läste och skrev en tabell som inte längre används för
-- grundning (resume_lookup var dessutom publik och gav inaktuella svar).
-- Magnet uppdaterar nu kunskapsbasen med kb_list/kb_get/kb_upsert/kb_append.
--
-- Tabellen resume_entries lämnas kvar tills vidare som arkiv.

update public.agent_skills
set enabled = false
where name in ('resume_lookup', 'add_resume_entry', 'update_resume_entry', 'enrich_resume_entry');
