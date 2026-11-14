-- The profile lives in the knowledge base (knowledge_docs). The old CV table
-- and the four disabled skills that wrote to it are gone.
drop table if exists public.resume_entries;
delete from public.agent_skills where handler = 'module:resume';

-- Log retention: agent and MCP logs older than p_days are removed. Items that
-- still wait for a decision (pending approval, needs review, running) are kept,
-- and so is the active objective. settings_history is a backup, not a log, and
-- is not touched.
create or replace function public.prune_agent_logs(p_days integer default 90)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  cutoff timestamptz := now() - make_interval(days => greatest(p_days, 7));
  n_activity integer; n_tasks integer; n_mcp integer; n_objectives integer; n_rate integer;
begin
  delete from agent_activity
   where created_at < cutoff and status not in ('pending_approval');
  get diagnostics n_activity = row_count;

  delete from agent_tasks
   where created_at < cutoff and status not in ('needs_review', 'running', 'pending');
  get diagnostics n_tasks = row_count;

  delete from mcp_activities where created_at < cutoff;
  get diagnostics n_mcp = row_count;

  delete from agent_objectives
   where status in ('completed', 'paused', 'failed', 'cancelled') and updated_at < cutoff;
  get diagnostics n_objectives = row_count;

  delete from rate_limits where window_start < now() - interval '1 day';
  get diagnostics n_rate = row_count;

  return jsonb_build_object('cutoff', cutoff, 'agent_activity', n_activity, 'agent_tasks', n_tasks,
    'mcp_activities', n_mcp, 'agent_objectives', n_objectives, 'rate_limits', n_rate);
end;
$$;

revoke all on function public.prune_agent_logs(integer) from public, anon, authenticated;

select cron.schedule('prune-agent-logs', '17 3 * * *', $cron$select public.prune_agent_logs(90)$cron$);
