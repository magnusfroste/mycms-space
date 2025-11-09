-- Create chat_settings table
CREATE TABLE public.chat_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_url TEXT NOT NULL DEFAULT 'https://agent.froste.eu/webhook/magnet',
  initial_placeholder TEXT NOT NULL DEFAULT 'Hi, I''m Magnet, Magnus agentic twin. How can I help you today?',
  active_placeholder TEXT NOT NULL DEFAULT 'How can Magnet help?',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quick_actions table
CREATE TABLE public.quick_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  icon TEXT NOT NULL,
  label TEXT NOT NULL,
  message TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (public read access for chat functionality)
ALTER TABLE public.chat_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_actions ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read on chat_settings"
ON public.chat_settings FOR SELECT
USING (true);

CREATE POLICY "Allow public read on quick_actions"
ON public.quick_actions FOR SELECT
USING (true);

-- Allow public write for admin (no auth in this simple setup)
CREATE POLICY "Allow public write on chat_settings"
ON public.chat_settings FOR ALL
USING (true);

CREATE POLICY "Allow public write on quick_actions"
ON public.quick_actions FOR ALL
USING (true);

-- Insert default settings
INSERT INTO public.chat_settings (webhook_url, initial_placeholder, active_placeholder)
VALUES (
  'https://agent.froste.eu/webhook/magnet',
  'Hi, I''m Magnet, Magnus agentic twin. How can I help you today?',
  'How can Magnet help?'
);

-- Insert default quick actions
INSERT INTO public.quick_actions (icon, label, message, order_index) VALUES
  ('💡', 'Sample Work', 'Show me some of your recent work', 1),
  ('🎯', 'Services', 'What services do you offer?', 2),
  ('📧', 'Get in Touch', 'I''d like to discuss a project', 3);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chat_settings_updated_at
BEFORE UPDATE ON public.chat_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();