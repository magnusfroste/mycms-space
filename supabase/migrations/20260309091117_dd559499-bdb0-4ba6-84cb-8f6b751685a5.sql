
CREATE OR REPLACE FUNCTION public.get_chat_sessions(p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
RETURNS TABLE(
  session_id text,
  first_message text,
  message_count bigint,
  started_at timestamptz,
  last_message_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    cm.session_id,
    COALESCE(
      (SELECT content FROM chat_messages cm2 
       WHERE cm2.session_id = cm.session_id AND cm2.role = 'user' 
       ORDER BY cm2.created_at ASC LIMIT 1),
      'No message'
    ) AS first_message,
    COUNT(*) AS message_count,
    MIN(cm.created_at) AS started_at,
    MAX(cm.created_at) AS last_message_at
  FROM chat_messages cm
  GROUP BY cm.session_id
  ORDER BY last_message_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;
