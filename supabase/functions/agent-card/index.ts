import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
  'Cache-Control': 'public, max-age=300',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: skills } = await supabase
    .from('agent_skills')
    .select('name, description, scope, category')
    .eq('enabled', true)
    .order('category');

  const agentCard = {
    name: "Magnet",
    description: "Magnus Froste's digital twin — an AI agent specializing in product strategy, AI/ML, business development, and 20+ years of tech leadership. Powered by ClawCMS.",
    url: "https://mycms.chat",
    version: "1.0.0",
    protocol: "a2a/1.0",
    provider: {
      name: "Magnus Froste",
      url: "https://mycms.chat",
      description: "Product & Business Development Leader | AI & Digital Transformation",
    },
    capabilities: {
      streaming: true,
      tool_calling: true,
      artifacts: true,
      conversation_memory: true,
    },
    authentication: { schemes: ["bearer"] },
    defaultInputModes: ["text"],
    defaultOutputModes: ["text", "artifact"],
    skills: (skills || []).map((s) => ({
      id: s.name.toLowerCase().replace(/\s+/g, '_'),
      name: s.name,
      description: s.description,
      scope: s.scope === 'internal' ? 'internal' : 'public',
      category: s.category,
      inputModes: ["text"],
      outputModes: ["text", s.scope !== 'internal' ? "artifact" : null].filter(Boolean),
    })),
    endpoints: {
      chat: "https://mycms.chat/chat",
      negotiate: "https://mycms.chat/a2a",
      api: `${Deno.env.get('SUPABASE_URL')}/functions/v1/ai-chat`,
    },
  };

  return new Response(JSON.stringify(agentCard, null, 2), { headers: corsHeaders });
});
