-- Add new columns to portfolio_settings
ALTER TABLE public.portfolio_settings 
ADD COLUMN section_subtitle TEXT DEFAULT '',
ADD COLUMN section_description TEXT DEFAULT '',
ADD COLUMN show_section BOOLEAN NOT NULL DEFAULT true;