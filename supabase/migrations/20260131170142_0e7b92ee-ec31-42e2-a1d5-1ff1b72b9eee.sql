-- ============================================
-- Settings History Table for Version Control
-- ============================================

-- Create the history table
CREATE TABLE public.settings_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  old_data JSONB NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  changed_by TEXT
);

-- Create index for faster lookups
CREATE INDEX idx_settings_history_table_record ON public.settings_history(table_name, record_id);
CREATE INDEX idx_settings_history_changed_at ON public.settings_history(changed_at DESC);

-- Enable RLS
ALTER TABLE public.settings_history ENABLE ROW LEVEL SECURITY;

-- RLS policies - only authenticated users can read history
CREATE POLICY "Authenticated users can view history"
ON public.settings_history
FOR SELECT
USING (true);

-- Only system (triggers) can insert - no direct user inserts
CREATE POLICY "System can insert history"
ON public.settings_history
FOR INSERT
WITH CHECK (true);

-- ============================================
-- Generic Trigger Function
-- ============================================

CREATE OR REPLACE FUNCTION public.log_settings_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log on UPDATE or DELETE
  IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    INSERT INTO public.settings_history (table_name, record_id, old_data, changed_by)
    VALUES (
      TG_TABLE_NAME,
      OLD.id,
      to_jsonb(OLD),
      COALESCE(auth.uid()::text, 'system')
    );
  END IF;
  
  -- Return appropriate value
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- ============================================
-- Attach Triggers to Critical Tables
-- ============================================

-- about_me_settings
CREATE TRIGGER log_about_me_settings_changes
BEFORE UPDATE OR DELETE ON public.about_me_settings
FOR EACH ROW
EXECUTE FUNCTION public.log_settings_change();

-- hero_settings
CREATE TRIGGER log_hero_settings_changes
BEFORE UPDATE OR DELETE ON public.hero_settings
FOR EACH ROW
EXECUTE FUNCTION public.log_settings_change();

-- portfolio_settings
CREATE TRIGGER log_portfolio_settings_changes
BEFORE UPDATE OR DELETE ON public.portfolio_settings
FOR EACH ROW
EXECUTE FUNCTION public.log_settings_change();

-- chat_settings
CREATE TRIGGER log_chat_settings_changes
BEFORE UPDATE OR DELETE ON public.chat_settings
FOR EACH ROW
EXECUTE FUNCTION public.log_settings_change();

-- page_blocks
CREATE TRIGGER log_page_blocks_changes
BEFORE UPDATE OR DELETE ON public.page_blocks
FOR EACH ROW
EXECUTE FUNCTION public.log_settings_change();

-- projects (also important to track)
CREATE TRIGGER log_projects_changes
BEFORE UPDATE OR DELETE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.log_settings_change();

-- ============================================
-- Cleanup function to keep only last 50 per table/record
-- ============================================

CREATE OR REPLACE FUNCTION public.cleanup_old_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete old entries, keeping only the last 50 per table_name + record_id
  DELETE FROM public.settings_history
  WHERE id IN (
    SELECT id FROM (
      SELECT id, 
             ROW_NUMBER() OVER (PARTITION BY table_name, record_id ORDER BY changed_at DESC) as rn
      FROM public.settings_history
    ) ranked
    WHERE rn > 50
  );
  RETURN NEW;
END;
$$;

-- Run cleanup after each insert
CREATE TRIGGER cleanup_history_trigger
AFTER INSERT ON public.settings_history
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_old_history();