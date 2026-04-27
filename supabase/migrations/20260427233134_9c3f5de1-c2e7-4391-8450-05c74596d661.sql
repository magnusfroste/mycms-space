
-- MCP API Keys table
CREATE TABLE public.mcp_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  key_prefix text NOT NULL,
  scopes text[] NOT NULL DEFAULT ARRAY['tools:read', 'tools:call']::text[],
  description text,
  last_used_at timestamptz,
  use_count integer NOT NULL DEFAULT 0,
  revoked boolean NOT NULL DEFAULT false,
  revoked_at timestamptz,
  expires_at timestamptz,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_mcp_api_keys_hash ON public.mcp_api_keys(key_hash) WHERE NOT revoked;
CREATE INDEX idx_mcp_api_keys_active ON public.mcp_api_keys(revoked, expires_at);

ALTER TABLE public.mcp_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can manage MCP keys"
ON public.mcp_api_keys FOR ALL
TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Service can read MCP keys"
ON public.mcp_api_keys FOR SELECT
TO anon
USING (true);

CREATE TRIGGER update_mcp_api_keys_updated_at
BEFORE UPDATE ON public.mcp_api_keys
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- MCP Activities table
CREATE TABLE public.mcp_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id uuid REFERENCES public.mcp_api_keys(id) ON DELETE SET NULL,
  key_name text,
  method text NOT NULL,
  tool_name text,
  input jsonb DEFAULT '{}'::jsonb,
  output jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'success',
  error_message text,
  duration_ms integer,
  client_info jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_mcp_activities_created_at ON public.mcp_activities(created_at DESC);
CREATE INDEX idx_mcp_activities_key ON public.mcp_activities(api_key_id, created_at DESC);
CREATE INDEX idx_mcp_activities_status ON public.mcp_activities(status, created_at DESC);

ALTER TABLE public.mcp_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read MCP activities"
ON public.mcp_activities FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated can manage MCP activities"
ON public.mcp_activities FOR ALL
TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Service can insert MCP activities"
ON public.mcp_activities FOR INSERT
TO anon
WITH CHECK (true);
