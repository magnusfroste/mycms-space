-- ============================================
-- AI Module Table: Global AI/Chat configuration
-- ============================================

-- Create the ai_module table
CREATE TABLE public.ai_module (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled BOOLEAN NOT NULL DEFAULT true,
  webhook_url TEXT NOT NULL DEFAULT 'https://agent.froste.eu/webhook/magnet',
  provider TEXT NOT NULL DEFAULT 'n8n',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_module ENABLE ROW LEVEL SECURITY;

-- Public read policy
CREATE POLICY "Public can read ai_module" 
ON public.ai_module 
FOR SELECT 
USING (true);

-- Public write policy (for admin)
CREATE POLICY "Public can write ai_module" 
ON public.ai_module 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Add updated_at trigger
CREATE TRIGGER update_ai_module_updated_at
BEFORE UPDATE ON public.ai_module
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate webhook_url from chat_settings
INSERT INTO public.ai_module (webhook_url)
SELECT webhook_url FROM public.chat_settings LIMIT 1;

-- Migrate placeholders and quick_actions to chat-widget blocks
UPDATE public.page_blocks pb
SET block_config = pb.block_config 
  || jsonb_build_object(
    'initial_placeholder', (SELECT initial_placeholder FROM public.chat_settings LIMIT 1),
    'active_placeholder', (SELECT active_placeholder FROM public.chat_settings LIMIT 1)
  )
  || jsonb_build_object(
    'quick_actions', COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'id', qa.id::text,
          'label', qa.label,
          'message', qa.message,
          'icon', qa.icon,
          'order_index', qa.order_index,
          'enabled', qa.enabled
        ) ORDER BY qa.order_index
      ) FROM public.quick_actions qa),
      '[]'::jsonb
    )
  )
WHERE pb.block_type = 'chat-widget';