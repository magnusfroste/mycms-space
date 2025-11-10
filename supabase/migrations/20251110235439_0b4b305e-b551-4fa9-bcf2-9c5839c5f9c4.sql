-- Create portfolio_settings table
CREATE TABLE public.portfolio_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_title TEXT NOT NULL DEFAULT 'My Portfolio - Proof of Concepts & AI Initiatives',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.portfolio_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow public read on portfolio_settings" 
ON public.portfolio_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public write on portfolio_settings" 
ON public.portfolio_settings 
FOR ALL 
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_portfolio_settings_updated_at
BEFORE UPDATE ON public.portfolio_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.portfolio_settings (section_title) 
VALUES ('My Portfolio - Proof of Concepts & AI Initiatives');