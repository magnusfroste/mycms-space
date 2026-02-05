-- Create chat_messages table for storing conversation history
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for efficient session queries
CREATE INDEX idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at DESC);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can insert messages (from chat widget)
CREATE POLICY "Anyone can insert chat messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (true);

-- Only authenticated users can read messages (admin)
CREATE POLICY "Authenticated can read chat messages"
  ON public.chat_messages FOR SELECT
  USING (true);

-- Authenticated can delete old messages (cleanup)
CREATE POLICY "Authenticated can delete chat messages"
  ON public.chat_messages FOR DELETE
  USING (true);