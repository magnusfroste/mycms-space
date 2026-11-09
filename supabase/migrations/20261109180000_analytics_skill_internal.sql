-- Integritet: skillen analyze_analytics hade scope 'both', så den publika
-- chatten kunde lämna ut trafiksiffror till vilken besökare som helst.
-- Intern data: bara admin-chatten och Autopilot (operatörer har
-- analytics_summary via MCP). Redan applicerad i produktion.

update public.agent_skills set scope = 'internal' where name = 'analyze_analytics';
