INSERT INTO agent_skills (name, description, handler, category, scope, requires_approval, enabled, tool_definition)
VALUES (
  'get_visitor_insights',
  'Analyze visitor browsing patterns (pages visited, visit count, returning status) to personalize conversations and provide relevant recommendations.',
  'builtin:get_visitor_insights',
  'engagement',
  'public',
  false,
  true,
  '{
    "type": "function",
    "function": {
      "name": "get_visitor_insights",
      "description": "Get insights about the current visitor browsing patterns for personalized conversation.",
      "parameters": {
        "type": "object",
        "properties": {
          "include_recommendations": { "type": "boolean" }
        }
      }
    }
  }'::jsonb
)
ON CONFLICT (name) DO NOTHING;