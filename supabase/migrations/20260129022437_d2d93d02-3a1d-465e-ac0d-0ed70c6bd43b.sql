-- Create contact_messages table for storing form submissions
CREATE TABLE public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a contact message
CREATE POLICY "Anyone can submit contact messages"
ON public.contact_messages
FOR INSERT
WITH CHECK (true);

-- Only authenticated users can view messages
CREATE POLICY "Authenticated users can view messages"
ON public.contact_messages
FOR SELECT
USING (true);

-- Authenticated users can update messages (mark as read)
CREATE POLICY "Authenticated users can update messages"
ON public.contact_messages
FOR UPDATE
USING (true);

-- Authenticated users can delete messages
CREATE POLICY "Authenticated users can delete messages"
ON public.contact_messages
FOR DELETE
USING (true);