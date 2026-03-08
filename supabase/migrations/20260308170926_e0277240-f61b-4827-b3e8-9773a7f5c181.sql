
CREATE TABLE public.resume_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  title text NOT NULL,
  subtitle text,
  description text,
  start_date date,
  end_date date,
  is_current boolean DEFAULT false,
  tags text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  order_index integer DEFAULT 0,
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.resume_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view enabled resume entries"
  ON public.resume_entries FOR SELECT USING (enabled = true);

CREATE POLICY "Authenticated can manage resume entries"
  ON public.resume_entries FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
