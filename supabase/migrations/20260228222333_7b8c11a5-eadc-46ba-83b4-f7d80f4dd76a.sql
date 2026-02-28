
-- Function to list cron jobs
CREATE OR REPLACE FUNCTION public.get_cron_jobs()
RETURNS TABLE(jobid bigint, schedule text, command text, nodename text, nodeport int, database text, username text, active boolean, jobname text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jobid, schedule, command, nodename, nodeport, database, username, active, jobname
  FROM cron.job
  ORDER BY jobname;
$$;

-- Function to alter cron job (toggle active / change schedule)
CREATE OR REPLACE FUNCTION public.alter_cron_job(
  job_name text,
  new_schedule text DEFAULT NULL,
  new_active boolean DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF new_active IS NOT NULL THEN
    UPDATE cron.job SET active = new_active WHERE jobname = job_name;
  END IF;
  IF new_schedule IS NOT NULL THEN
    PERFORM cron.alter_job(
      job_id := (SELECT jobid FROM cron.job WHERE jobname = job_name),
      schedule := new_schedule
    );
  END IF;
END;
$$;
