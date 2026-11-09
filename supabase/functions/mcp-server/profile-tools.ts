// ============================================
// Profile tools for external agents (anonymous-friendly)
//
// get_profile          – who the site owner is: positioning, themes, current role, links
// analyze_job_fit      – score a job/assignment against the CV (AI)
// generate_tailored_cv – match analysis + tailored CV + cover letter (AI),
//                        same schema as the site's CV agent block
// contact_owner        – leave a message; lands in contact_messages and
//                        triggers the same contact_received signal as the site form
//                        (contact_magnus is kept as an unlisted alias)
//
// Descriptions use the owner's name from the resume module, so the same server
// works for any install of the CMS.
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

export interface Owner {
  name: string;
  first: string;
  siteUrl: string | null;
  siteTitle: string | null;
  github: string | null;
}

/** Owner name and links from the resume, seo and github modules. */
export async function loadOwner(supabase: Supabase): Promise<Owner> {
  const { data } = await supabase.from("modules").select("module_type, module_config").in("module_type", ["resume", "seo", "github"]);
  const cfg = (t: string) => ((data || []).find((m: { module_type: string }) => m.module_type === t)?.module_config || {}) as Record<string, string>;
  const res = cfg("resume"), seo = cfg("seo"), gh = cfg("github");
  const name = (res.owner_name || seo.site_title || "the site owner").trim();
  return {
    name,
    first: name.split(/\s+/)[0],
    siteUrl: seo.site_url || null,
    siteTitle: seo.site_title || null,
    github: gh.username ? `https://github.com/${gh.username}` : null,
  };
}

export const profileTools = (o: Owner) => [
  {
    name: "get_profile",
    description: `Get ${o.name}'s professional profile: positioning, target audience, offering, core themes, current roles, availability and links. Start here to understand who ${o.first} is.`,
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "analyze_job_fit",
    description: `Analyze how well ${o.first} fits a job description or consulting assignment. Returns an overall score 0-100, a one-line summary, skill-by-skill match, strengths, gaps and a recommendation. Faster and cheaper than generate_tailored_cv.`,
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
    description: "Generate a match analysis, a CV tailored to the job and a cover letter, all in markdown. Same output as the CV agent on the website.",
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
    name: "contact_owner",
    description: `Send a message to ${o.first} on behalf of a person, e.g. an assignment request after analyze_job_fit. Requires the sender's real name and email. ${o.first} answers personally.`,
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

const CONTACT_TOOLS = new Set(["contact_owner", "contact_magnus"]);
export const PROFILE_TOOL_NAMES = new Set(["get_profile", "analyze_job_fit", "generate_tailored_cv", ...CONTACT_TOOLS]);


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
        recommendation: { type: "string", description: "One short paragraph: should they talk to the candidate, and about what?" },
      },
      required: ["overall_score", "summary", "match_analysis", "strengths", "gaps", "recommendation"],
    },
  },
};

const ANALYST_SYSTEM = (resume: string, owner: Owner) => `You assess how well ${owner.name} fits a role or consulting assignment.
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
  const owner = await loadOwner(supabase);
  if (name === "get_profile") {
    const [autopilot, seo, resumeMod] = await Promise.all([
      supabase.from("modules").select("module_config").eq("module_type", "autopilot").maybeSingle(),
      supabase.from("modules").select("module_config").eq("module_type", "seo").maybeSingle(),
      supabase.from("modules").select("module_config").eq("module_type", "resume").maybeSingle(),
    ]);
    const brief = autopilot.data?.module_config?.editor_brief || {};
    const seoCfg = seo.data?.module_config || {};
    const res = resumeMod.data?.module_config || {};
    return JSON.stringify({
      name: owner.name,
      title: res.owner_title || seoCfg.site_description || null,
      summary: res.owner_summary || null,
      location: res.owner_location || null,
      availability: res.owner_availability ? `${res.owner_availability}${res.availability_note ? ` — ${res.availability_note}` : ""}` : null,
      positioning: brief.positioning || null,
      audience: brief.audience || null,
      offering: brief.offering || null,
      core_themes: (brief.themes || []).map((t: { name: string; angle: string }) => ({ name: t.name, angle: t.angle })),
      links: {
        website: owner.siteUrl,
        linkedin: seoCfg.linkedin_url || null,
        github: owner.github,
        blog: owner.siteUrl ? `${owner.siteUrl.replace(/\/$/, "")}/blog` : null,
      },
      next_steps: `Use kb_list / kb_get for the full profile (roles, projects, history), search_projects for relevant work, analyze_job_fit for a role, and contact_owner to reach ${owner.first}.`,
    }, null, 2);
  }

  if (name === "analyze_job_fit" || name === "generate_tailored_cv") {
    if (ctx.anonymous && (await anonCallsLastHour(supabase, ["analyze_job_fit", "generate_tailored_cv"])) >= ANON_AI_CALLS_PER_HOUR) {
      return JSON.stringify({ error: `Rate limit reached for anonymous AI tools. Try again later or ask ${owner.first} for an API key.` });
    }
    const job = jobText(args);
    const resume = await loadResumeContext();
    if (!resume) throw new Error("Profile data is unavailable right now.");
    const system = `${ANALYST_SYSTEM(resume, owner)}\n\n${languageRule(args)}`;

    if (name === "analyze_job_fit") {
      const result = await forcedToolCall(system, `JOB DESCRIPTION:\n${job}`, jobFitTool);
      return JSON.stringify(result, null, 2);
    }
    const result = await forcedToolCall(
      `${system}\nThe tailored CV must only reorder, select and phrase real experience from the profile. The cover letter is written by ${owner.first} in first person.`,
      `JOB DESCRIPTION:\n${job}`,
      cvAgentTool,
    );
    return JSON.stringify(result, null, 2);
  }

  if (CONTACT_TOOLS.has(name)) {
    const contactName = String(args.name || "").trim().slice(0, 120);
    const email = String(args.email || "").trim().slice(0, 200);
    const message = String(args.message || "").trim().slice(0, 5_000);
    const subject = String(args.subject || "").trim().slice(0, 200);
    if (!contactName || !message) throw new Error("name and message are required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new Error("A valid email address is required.");

    if (ctx.anonymous && (await anonCallsLastHour(supabase, [...CONTACT_TOOLS])) >= ANON_CONTACTS_PER_HOUR) {
      return JSON.stringify({ error: `Too many messages right now. Please try again later${owner.siteUrl ? ` or use the contact form on ${owner.siteUrl}` : ""}.` });
    }

    const { error } = await supabase.from("contact_messages").insert({
      name: contactName,
      email,
      subject: `[via AI-agent] ${subject || "Meddelande"}`,
      message,
    });
    if (error) throw error;
    return JSON.stringify({ status: "sent", note: `The message was delivered to ${owner.first}, who replies personally by email.` });
  }

  throw new Error(`Unknown profile tool: ${name}`);
}
