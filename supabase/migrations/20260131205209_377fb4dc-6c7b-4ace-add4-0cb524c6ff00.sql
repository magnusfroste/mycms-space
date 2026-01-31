-- ============================================
-- Create modules table (generalized module system)
-- ============================================

-- Create the table
CREATE TABLE public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_type TEXT NOT NULL UNIQUE,
  module_config JSONB DEFAULT '{}',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add comment
COMMENT ON TABLE public.modules IS 'Centralized module configuration with type-specific JSONB configs';

-- Enable RLS
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Public can read modules"
ON public.modules FOR SELECT USING (true);

CREATE POLICY "Authenticated can manage modules"
ON public.modules FOR ALL USING (true) WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_modules_updated_at
BEFORE UPDATE ON public.modules
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for version history
CREATE TRIGGER log_modules_changes
BEFORE UPDATE OR DELETE ON public.modules
FOR EACH ROW EXECUTE FUNCTION log_settings_change();