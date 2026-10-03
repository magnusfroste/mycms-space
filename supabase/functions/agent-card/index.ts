import { createClient } from "npm:@supabase/supabase-js@2";
import { loadSEOConfig } from "../_shared/seo-config.ts";

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

  const seo = await loadSEOConfig(supabase);
  const siteUrl = seo.site_url.replace(/\/$/, "");
  const supabaseUrl = Deno.env.get('SUPABASE_URL');

  const { data: skills } = await supabase
    .from('agent_skills')
    .select('name, description, scope, category')
    .eq('enabled', true)
    .order('category');

  const agentCard = {
    name: "Magnet",
    description: "Magnus Froste's digital twin — an AI agent specializing in product strategy, AI/ML, business development, and 20+ years of tech leadership. Powered by mycms.chat.",
    url: siteUrl,
    version: "1.0.0",
    protocol: "a2a/1.0",
    provider: {
      name: "Magnus Froste",
      url: siteUrl,
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
      chat: `${siteUrl}/chat`,
      negotiate: `${supabaseUrl}/functions/v1/a2a-negotiate`,
      api: `${supabaseUrl}/functions/v1/ai-chat`,
      mcp: `${supabaseUrl}/functions/v1/mcp-server`,
    },
  };

  return new Response(JSON.stringify(agentCard, null, 2), { headers: corsHeaders });
});
