// ============================================
// Profile tools for external agents (anonymous-friendly)
//
// get_profile          – who Magnus is: positioning, themes, current role, links
// analyze_job_fit      – score a job/assignment against the CV (AI)
// generate_tailored_cv – match analysis + tailored CV + cover letter (AI),
//                        same schema as the site's CV agent block
// contact_magnus       – leave a message; lands in contact_messages and
//                        triggers the same contact_received signal as the site form
//
// AI tools and contact are rate limited for anonymous callers.
// ============================================

import { callOpenAICompatible, resolveProvider } from "../_shared/ai-agent.ts";
import { cvAgentTool } from "../_shared/ai-tools.ts";
import { loadResumeContext } from "../_shared/ai-context.ts";

// deno-lint-ignore no-explicit-any
type Supabase = any;

const MAX_JOB_TEXT = 15_000;
const ANON_AI_CALLS_PER_HOUR = 20;
const ANON_CONTACTS_PER_HOUR = 5;

export const PROFILE_TOOLS = [
  {
    name: "get_profile",
    description: "Get Magnus Froste's professional profile: positioning, target audience, what he offers, core themes, current roles, availability and links. Start here to understand who Magnus is.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "analyze_job_fit",
    description: "Analyze how well Magnus fits a job description or consulting assignment. Returns an overall score 0-100, a one-line summary, skill-by-skill match, strengths, gaps and a recommendation. Faster and cheaper than generate_tailored_cv.",
    inputSchema: {
      type: "object",
      properties: {
        job_description: { type: "string", description: "The full job description or assignment text (max 15 000 characters)." },
        language: { type: "string", description: "Optional: answer language, 'sv' or 'en' (default: same as the job description)." },
      },
      required: ["job_description"],
    },
  },
  {
    name: "generate_tailored_cv",
    description: "Generate a match analysis, a CV tailored to the job and a cover letter, all in markdown. Same output as the CV agent on www.froste.eu.",
    inputSchema: {
      type: "object",
      properties: {
        job_description: { type: "string", description: "The full job description or assignment text (max 15 000 characters)." },
        language: { type: "string", description: "Optional: output language, 'sv' or 'en' (default: same as the job description)." },
      },
      required: ["job_description"],
    },
  },
  {
    name: "contact_magnus",
    description: "Send a message to Magnus on behalf of a person, e.g. an assignment request after analyze_job_fit. Requires the sender's real name and email. Magnus answers personally.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Sender's full name." },
        email: { type: "string", description: "Sender's email address for the reply." },
        subject: { type: "string", description: "Short subject line." },
        message: { type: "string", description: "The message (max 5 000 characters)." },
      },
      required: ["name", "email", "message"],
    },
  },
];

export const PROFILE_TOOL_NAMES = new Set(PROFILE_TOOLS.map((t) => t.name));

// ---------- helpers ----------

async function anonCallsLastHour(supabase: Supabase, tools: string[]): Promise<number> {
  const since = new Date(Date.now() - 3_600_000).toISOString();
  const { count } = await supabase
    .from("mcp_activities")
    .select("id", { count: "exact", head: true })
    .is("api_key_id", null)
    .in("tool_name", tools)
    .gte("created_at", since);
  return count || 0;
}

function jobText(args: Record<string, unknown>): string {
  const text = String(args.job_description || "").trim();
  if (text.length < 80) throw new Error("job_description is missing or too short (min 80 characters).");
  return text.slice(0, MAX_JOB_TEXT);
}

function languageRule(args: Record<string, unknown>): string {
  const lang = String(args.language || "").toLowerCase();
  if (lang.startsWith("sv")) return "Answer in Swedish.";
  if (lang.startsWith("en")) return "Answer in English.";
  return "Answer in the same language as the job description.";
}

async function forcedToolCall(system: string, user: string, tool: typeof cvAgentTool): Promise<Record<string, unknown>> {
  const { url, apiKey, model } = resolveProvider({ provider: "lovable" });
  const data = await callOpenAICompatible({
    url, apiKey, model,
    messages: [{ role: "system", content: system }, { role: "user", content: user }],
    tools: [tool],
    toolChoice: { type: "function", function: { name: tool.function.name } },
  });
  const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) throw new Error("The model did not return a structured result.");
  return JSON.parse(args);
}

const cvProps = (cvAgentTool.function.parameters as { properties: Record<string, unknown> }).properties;

const jobFitTool = {
  type: "function" as const,
  function: {
    name: "job_fit",
    description: "Structured job fit analysis.",
    parameters: {
      type: "object",
      properties: {
        overall_score: cvProps.overall_score,
        summary: cvProps.summary,
        match_analysis: cvProps.match_analysis,
        strengths: { type: "array", items: { type: "string" }, description: "Concrete strengths backed by the CV." },
        gaps: { type: "array", items: { type: "string" }, description: "Honest gaps or risks." },
        recommendation: { type: "string", description: "One short paragraph: should they talk to Magnus, and about what?" },
      },
      required: ["overall_score", "summary", "match_analysis", "strengths", "gaps", "recommendation"],
    },
  },
};

const ANALYST_SYSTEM = (resume: string) => `You assess how well Magnus Froste fits a role or consulting assignment.
Base every claim strictly on the profile below. Never invent experience, employers, certifications or dates. Be honest about gaps.
Skill levels are 0-10. The overall score is 0-100.

PROFILE:
${resume}`;

// ---------- dispatcher ----------

export async function callProfileTool(
  supabase: Supabase,
  name: string,
  args: Record<string, unknown>,
  ctx: { anonymous: boolean },
): Promise<string> {
  if (name === "get_profile") {
    const [autopilot, seo, resumeMod, current] = await Promise.all([
      supabase.from("modules").select("module_config").eq("module_type", "autopilot").maybeSingle(),
      supabase.from("modules").select("module_config").eq("module_type", "seo").maybeSingle(),
      supabase.from("modules").select("module_config").eq("module_type", "resume").maybeSingle(),
      supabase.from("resume_entries").select("title, subtitle, description").eq("enabled", true).eq("is_current", true).order("order_index"),
    ]);
    const brief = autopilot.data?.module_config?.editor_brief || {};
    const seoCfg = seo.data?.module_config || {};
    const res = resumeMod.data?.module_config || {};
    return JSON.stringify({
      name: res.owner_name || "Magnus Froste",
      title: res.owner_title || seoCfg.site_description || null,
      summary: res.owner_summary || null,
      location: res.owner_location || null,
      availability: res.owner_availability ? `${res.owner_availability}${res.availability_note ? ` — ${res.availability_note}` : ""}` : null,
      positioning: brief.positioning || null,
      audience: brief.audience || null,
      offering: brief.offering || null,
      core_themes: (brief.themes || []).map((t: { name: string; angle: string }) => ({ name: t.name, angle: t.angle })),
      current_roles: current.data || [],
      links: {
        website: seoCfg.site_url || "https://www.froste.eu",
        linkedin: seoCfg.linkedin_url || null,
        github: "https://github.com/magnusfroste",
        blog: `${seoCfg.site_url || "https://www.froste.eu"}/blog`,
      },
      next_steps: "Use get_resume for the full CV, search_projects for relevant work, analyze_job_fit for a role, and contact_magnus to reach him.",
    }, null, 2);
  }

  if (name === "analyze_job_fit" || name === "generate_tailored_cv") {
    if (ctx.anonymous && (await anonCallsLastHour(supabase, ["analyze_job_fit", "generate_tailored_cv"])) >= ANON_AI_CALLS_PER_HOUR) {
      return JSON.stringify({ error: "Rate limit reached for anonymous AI tools. Try again later or ask Magnus for an API key." });
    }
    const job = jobText(args);
    const resume = await loadResumeContext();
    if (!resume) throw new Error("Profile data is unavailable right now.");
    const system = `${ANALYST_SYSTEM(resume)}\n\n${languageRule(args)}`;

    if (name === "analyze_job_fit") {
      const result = await forcedToolCall(system, `JOB DESCRIPTION:\n${job}`, jobFitTool);
      return JSON.stringify(result, null, 2);
    }
    const result = await forcedToolCall(
      `${system}\nThe tailored CV must only reorder, select and phrase real experience from the profile. The cover letter is written by Magnus in first person.`,
      `JOB DESCRIPTION:\n${job}`,
      cvAgentTool,
    );
    return JSON.stringify(result, null, 2);
  }

  if (name === "contact_magnus") {
    const contactName = String(args.name || "").trim().slice(0, 120);
    const email = String(args.email || "").trim().slice(0, 200);
    const message = String(args.message || "").trim().slice(0, 5_000);
    const subject = String(args.subject || "").trim().slice(0, 200);
    if (!contactName || !message) throw new Error("name and message are required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new Error("A valid email address is required.");

    if (ctx.anonymous && (await anonCallsLastHour(supabase, ["contact_magnus"])) >= ANON_CONTACTS_PER_HOUR) {
      return JSON.stringify({ error: "Too many messages right now. Please try again later or use the form on www.froste.eu/contact." });
    }

    const { error } = await supabase.from("contact_messages").insert({
      name: contactName,
      email,
      subject: `[via AI-agent] ${subject || "Meddelande"}`,
      message,
    });
    if (error) throw error;
    return JSON.stringify({ status: "sent", note: "The message was delivered to Magnus. He replies personally by email." });
  }

  throw new Error(`Unknown profile tool: ${name}`);
}
