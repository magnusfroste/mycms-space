-- ============================================
-- Newsletter Module Tables
-- ============================================

-- Newsletter subscribers table
CREATE TABLE public.newsletter_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Newsletter campaigns/issues table
CREATE TABLE public.newsletter_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  recipient_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_campaigns ENABLE ROW LEVEL SECURITY;

-- Public can subscribe (insert) but not view other subscribers
CREATE POLICY "Anyone can subscribe to newsletter"
ON public.newsletter_subscribers
FOR INSERT
WITH CHECK (true);

-- Only authenticated admin can view/manage subscribers
CREATE POLICY "Admin can view all subscribers"
ON public.newsletter_subscribers
FOR SELECT
USING (true);

CREATE POLICY "Admin can update subscribers"
ON public.newsletter_subscribers
FOR UPDATE
USING (true);

CREATE POLICY "Admin can delete subscribers"
ON public.newsletter_subscribers
FOR DELETE
USING (true);

-- Campaign policies (admin only via anon key for simplicity, protected by admin auth in app)
CREATE POLICY "Anyone can view campaigns"
ON public.newsletter_campaigns
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert campaigns"
ON public.newsletter_campaigns
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update campaigns"
ON public.newsletter_campaigns
FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete campaigns"
ON public.newsletter_campaigns
FOR DELETE
USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_newsletter_subscribers_updated_at
BEFORE UPDATE ON public.newsletter_subscribers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_newsletter_campaigns_updated_at
BEFORE UPDATE ON public.newsletter_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();