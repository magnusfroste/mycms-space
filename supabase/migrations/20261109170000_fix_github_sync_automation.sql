-- GitHub-synken: automationen "Night: GitHub Sync" var kopplad till skillen
-- research_topic (AI-research) i stället för sync_github_repos, och skillen
-- skickade inget användarnamn, så inget sparades sedan april.
-- github-repos har nu action 'sync' som läser användarnamnet från
-- github-modulen och sparar repona. Redan applicerad i produktion.

update public.agent_automations a
set skill_name = 'sync_github_repos',
    skill_id = s.id,
    skill_arguments = '{"action":"sync"}'::jsonb,
    last_error = null
from public.agent_skills s
where s.name = 'sync_github_repos' and a.name = 'Night: GitHub Sync';
