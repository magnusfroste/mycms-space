// ============================================
// Redaktören – veckans blogginlägg med kvalitet före volym
//
// 1. Profilbrief: kärnteman, positionering och röst byggs från CV,
//    GitHub-projekt, SEO-profil och publicerade inlägg. Sparas i
//    modules.autopilot.module_config.editor_brief och byggs om var 30:e dag.
// 2. Ämnesval: veckans nyheter per kärntema; modellen väljer ETT ämne där
//    Magnus har en egen tes, och undviker det som redan skrivits.
// 3. Research: riktade sökningar, numrerad källista med URL:er.
// 4. Skrivande i Magnus röst, på svenska, med länkade källor.
// 5. Kvalitetsgrind: källkrav, längd, inga påhittade länkar, ingen
//    mall-titel, inte för likt tidigare titlar, granskning ≥ 7/10.
//    Ett revisionsförsök; annars sparas inget utkast.
// 6. Publicering: med auto_publish i autopilot-modulen publiceras ett utkast
//    som klarar alla mekaniska krav och får minst auto_publish_min_score
//    (standard 8) direkt. Övriga hamnar i granskningskön som tidigare.
// ============================================

import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { parseModelJson } from "../_shared/model-json.ts";
import { callOpenAICompatible, ModelTimeoutError } from "../_shared/ai-agent.ts";
import { resolveConfiguredDefaultAI } from "../_shared/ai-provider.ts";
import { loadKnowledgeBase } from "../_shared/ai-context.ts";

type Supabase = SupabaseClient;

export interface EditorBrief {
  built_at: string;
  positioning: string;
  audience: string;
  offering: string;
  voice: string;
  themes: Array<{ name: string; angle: string; search_terms: string[] }>;
  avoid: string[];
}

export interface DraftToSave {
  title: string;
  content: string;
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
}

export interface EditorDeps {
  saveDraft: (draft: DraftToSave) => Promise<{ postId: string; slug: string; coverImageUrl: string | null }>;
  /** Continue this task in a new invocation (the edge time limit is per invocation). */
  continueLater?: (taskId: string) => Promise<void>;
}

async function autoPublishPolicy(supabase: Supabase): Promise<{ enabled: boolean; minScore: number }> {
  const { data } = await supabase.from("modules").select("module_config").eq("module_type", "autopilot").maybeSingle();
  const c = (data?.module_config || {}) as Record<string, unknown>;
  const n = Number(c.auto_publish_min_score);
  return {
    enabled: c.auto_publish === true,
    minScore: Number.isFinite(n) ? Math.max(MIN_REVIEW_SCORE, Math.min(10, Math.floor(n))) : DEFAULT_AUTO_PUBLISH_SCORE,
  };
}

interface Source {
  n: number;
  title: string;
  url: string;
  text: string;
}

const BRIEF_MAX_AGE_DAYS = 30;
const MIN_SOURCES = 3;
const MIN_WORDS = 700;
const MAX_WORDS = 1800;
const MIN_REVIEW_SCORE = 7;
/** After this many seconds an invocation hands the rest to a new one (edge limit is 400 s per invocation). */
const HANDOFF_AFTER_S = 60;
/** An invocation that has already run this long does not start another model call. */
const NO_NEW_CALL_AFTER_S = 150;
const MAX_HOPS = 8;
const MAX_TIMEOUT_RETRIES = 2;
const DEFAULT_AUTO_PUBLISH_SCORE = 8;
const FAST_MODEL = "google/gemini-3-flash-preview";
const WRITER_MODEL = "google/gemini-2.5-pro";

// ---------- model helpers ----------

/** Seconds an invocation may spend on model calls; the edge limit is ~400 s. */
const CALL_BUDGET_S = 330;
/** When the current invocation's model calls must have finished (epoch ms); 0 = no deadline. */
let callDeadline = 0;

async function chat(system: string, user: string, model: string): Promise<string> {
  // Use the Integrations default; task-specific model names apply to Lovable.
  const ai = await resolveConfiguredDefaultAI(model);
  // A hung call must fail inside this invocation, so it is recorded and retried.
  const timeoutMs = callDeadline ? Math.max(20_000, callDeadline - Date.now()) : 240_000;
  try {
    const data = await callOpenAICompatible({
      url: ai.url, apiKey: ai.apiKey, model: ai.model,
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      timeoutMs,
    });
    return data.choices?.[0]?.message?.content || "";
  } catch (e) {
    if (e instanceof ModelTimeoutError || model === FAST_MODEL) throw e;
    console.warn(`[editor] ${model} failed, falling back to ${FAST_MODEL}:`, e);
    return chat(system, user, FAST_MODEL);
  }
}

/** A chat whose answer must be JSON: tolerant parsing, and one retry that names the error. */
async function chatJson<T>(system: string, user: string, model: string): Promise<T> {
  const raw = await chat(system, user, model);
  try {
    return parseModelJson<T>(raw);
  } catch (e) {
    console.warn(`[editor] invalid JSON from the model, retrying once: ${(e as Error).message}`);
    const again = await chat(system, `${user}\n\nYour previous answer was not valid JSON (${(e as Error).message}). Answer again with valid JSON only, no prose and no code fences.`, model);
    return parseModelJson<T>(again);
  }
}

// ---------- web search ----------

async function search(query: string, opts: { tbs?: string; limit?: number; chars?: number }): Promise<Array<{ title: string; url: string; text: string }>> {
  const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!apiKey) throw new Error("Firecrawl not configured");
  const res = await fetch("https://api.firecrawl.dev/v1/search", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      limit: opts.limit ?? 5,
      ...(opts.tbs ? { tbs: opts.tbs } : {}),
      scrapeOptions: { formats: ["markdown"], onlyMainContent: true },
    }),
  });
  if (!res.ok) {
    console.warn(`[editor] search failed (${res.status}) for: ${query}`);
    return [];
  }
  const data = await res.json();
  return (data.data || [])
    .filter((i: { url?: string }) => i.url && !/\/(form|forms|login|signin|signup|register|subscribe)(\/|\?|$)/i.test(i.url))
    .map((i: { title?: string; url: string; markdown?: string; description?: string }) => ({
      title: i.title || i.url,
      url: i.url,
      text: (i.markdown || i.description || "").slice(0, opts.chars ?? 400),
    }));
}

// ---------- 1. profile brief ----------

async function buildBrief(supabase: Supabase): Promise<EditorBrief> {
  const [repos, seo, posts] = await Promise.all([
    supabase.from("github_repos").select("name, enriched_title, enriched_description, why_it_matters, topics, stars, pushed_at").eq("enabled", true).order("pushed_at", { ascending: false }).limit(20),
    supabase.from("modules").select("module_config").eq("module_type", "seo").maybeSingle(),
    supabase.from("blog_posts").select("title, excerpt").eq("status", "published").order("published_at", { ascending: false }).limit(15),
  ]);

  const repoText = (repos.data || []).map((r) =>
    `- ${r.enriched_title || r.name}: ${(r.enriched_description || "").slice(0, 200)} ${r.why_it_matters ? `| Varför: ${r.why_it_matters.slice(0, 150)}` : ""}`
  ).join("\n");
  const seoCfg = (seo.data?.module_config || {}) as Record<string, string>;
  const postText = (posts.data || []).map((p) => `- ${p.title}`).join("\n");
  // The public knowledge base is the profile source.
  const kbText = (await loadKnowledgeBase({ includePrivate: false }))?.slice(0, 40_000) || "";

  const parsed = await chatJson<Omit<EditorBrief, "built_at">>(
    `Du är chefredaktör och varumärkesstrateg. Du bygger en redaktionell brief för en personlig expertblogg.
Svara ENBART med JSON enligt schemat:
{"positioning": "1–2 meningar om vem personen är och vad hen står för",
 "audience": "vem bloggen skrivs för, konkret",
 "offering": "vad personen erbjuder (konsultuppdrag, rådgivning, produkter) – används för en diskret avslutning, aldrig säljig",
 "voice": "3–5 meningar om tonläge, baserat på publicerade texter och profil",
 "themes": [{"name": "kärntema", "angle": "personens unika vinkel/erfarenhet på temat", "search_terms": ["2–3 engelska eller svenska söktermer för veckans nyheter"]}],
 "avoid": ["ämnen, vinklar eller grepp som redan är uttjatade på bloggen eller inte passar profilen"]}
Ge 4–6 teman. Teman ska täcka personens faktiska expertis och projekt – inte bara det bloggen hittills skrivit om.`,
    `SEO-profil: ${seoCfg.site_title || ""} – ${seoCfg.site_description || ""}

CV / kunskapsbas:
${kbText}

Egna projekt (GitHub):
${repoText}

Senast publicerade inlägg:
${postText}`,
    WRITER_MODEL,
  );

  if (!parsed.themes?.length) throw new Error("Brief saknar teman");
  return { ...parsed, built_at: new Date().toISOString() };
}

async function getBrief(supabase: Supabase, rebuild: boolean): Promise<EditorBrief> {
  const { data } = await supabase.from("modules").select("id, module_config").eq("module_type", "autopilot").maybeSingle();
  const cfg = (data?.module_config || {}) as Record<string, unknown>;
  const existing = cfg.editor_brief as EditorBrief | undefined;
  const ageDays = existing?.built_at ? (Date.now() - new Date(existing.built_at).getTime()) / 86_400_000 : Infinity;
  if (existing && !rebuild && ageDays < BRIEF_MAX_AGE_DAYS) return existing;

  const brief = await buildBrief(supabase);
  if (data?.id) {
    await supabase.from("modules").update({ module_config: { ...cfg, editor_brief: brief } }).eq("id", data.id);
  }
  console.log(`[editor] Brief built with ${brief.themes.length} themes`);
  return brief;
}

// ---------- 2. topic selection ----------

interface TopicPick {
  topic: string;
  thesis: string;
  theme: string;
  why_this_author: string;
  news_urls: string[];
  research_queries: string[];
}

async function existingTitles(supabase: Supabase): Promise<string[]> {
  const { data } = await supabase.from("blog_posts").select("title").order("created_at", { ascending: false }).limit(80);
  return (data || []).map((p) => p.title);
}

async function pickTopic(brief: EditorBrief, titles: string[], forcedTopic?: string): Promise<{ pick: TopicPick; news: Array<{ title: string; url: string; text: string }> }> {
  let news: Array<{ title: string; url: string; text: string }> = [];
  if (!forcedTopic) {
    const queries = brief.themes.flatMap((t) => t.search_terms.slice(0, 2));
    const results = await Promise.all(queries.slice(0, 10).map((q) => search(q, { tbs: "qdr:w", limit: 4, chars: 350 })));
    const seen = new Set<string>();
    news = results.flat().filter((n) => (seen.has(n.url) ? false : (seen.add(n.url), true))).slice(0, 30);
    if (news.length === 0) throw new Error("Inga nyheter hittades för veckan – kontrollera Firecrawl");
  }

  const pick = await chatJson<TopicPick>(
    `Du är chefredaktör för en personlig expertblogg. Välj veckans ENDA ämne.
Krav:
- Ämnet ska vara aktuellt (helst förankrat i veckans nyheter) OCH ligga i ett av kärntemana.
- Författaren ska ha en egen, icke-uppenbar tes som springer ur sin erfarenhet eller sina projekt. "Sverige behöver egna AI-modeller" och liknande generella ståndpunkter räknas inte.
- Ämnet får inte överlappa redan skrivna titlar eller listan "avoid".
Svara ENBART med JSON:
{"topic": "ämnet i en mening", "thesis": "författarens tes i en mening", "theme": "vilket kärntema", "why_this_author": "vilken konkret erfarenhet/projekt som ger trovärdighet", "news_urls": ["0–3 URL:er ur nyhetslistan som ämnet bygger på"], "research_queries": ["3 sökfrågor för fördjupad research: fakta, siffror, motargument"]}`,
    `BRIEF
Positionering: ${brief.positioning}
Målgrupp: ${brief.audience}
Kärnteman:
${brief.themes.map((t) => `- ${t.name}: ${t.angle}`).join("\n")}
Undvik: ${brief.avoid.join("; ")}

REDAN SKRIVNA TITLAR
${titles.map((t) => `- ${t}`).join("\n")}

${forcedTopic ? `ÖNSKAT ÄMNE (från redaktören): ${forcedTopic}` : `VECKANS NYHETER
${news.map((n) => `- ${n.title} | ${n.url}\n  ${n.text.replace(/\s+/g, " ").slice(0, 250)}`).join("\n")}`}`,
    FAST_MODEL,
  );
  if (!pick.topic || !pick.thesis) throw new Error("Ämnesvalet saknar ämne eller tes");
  return { pick, news };
}

// ---------- 3. research ----------

async function research(pick: TopicPick, news: Array<{ title: string; url: string; text: string }>): Promise<Source[]> {
  const fromNews = news.filter((n) => pick.news_urls?.includes(n.url));
  const deep = await Promise.all((pick.research_queries || []).slice(0, 3).map(async (q) => {
    const recent = await search(q, { tbs: "qdr:m", limit: 4, chars: 2500 });
    return recent.length ? recent : search(q, { limit: 4, chars: 2500 });
  }));
  // Re-fetch the chosen news items with full text
  const newsFull = await Promise.all(fromNews.map((n) => search(n.url, { limit: 1, chars: 2500 }).then((r) => r[0] || n)));

  const seen = new Set<string>();
  const merged = [...newsFull, ...deep.flat()].filter((s) => s.text && (seen.has(s.url) ? false : (seen.add(s.url), true)));

  // Too thin? Broaden once: the topic itself and the thesis, without a time filter.
  if (merged.length < MIN_SOURCES) {
    const extra = await Promise.all([pick.topic, pick.thesis].filter(Boolean).map((q) => search(q, { limit: 5, chars: 2500 })));
    for (const s of extra.flat()) if (s.text && !seen.has(s.url)) { seen.add(s.url); merged.push(s); }
  }
  return merged.slice(0, 10).map((s, i) => ({ n: i + 1, title: s.title, url: s.url, text: s.text }));
}

// ---------- 4. writing ----------

/**
 * What the author's own projects actually are, from the GitHub sync
 * (enriched title + description). The writer may describe a project only
 * with these facts, and the reviewer checks against the same list — the
 * model otherwise invents features (e.g. calling a handbook a sandbox tool).
 */
async function projectFacts(supabase: Supabase): Promise<string> {
  const { data } = await supabase.from("github_repos")
    .select("name, enriched_title, enriched_description, description")
    .eq("enabled", true)
    .order("featured", { ascending: false })
    .order("order_index")
    .limit(40);
  return (data || []).map((r: { name: string; enriched_title: string | null; enriched_description: string | null; description: string | null }) => {
    const text = (r.enriched_description || r.description || "").replace(/\s+/g, " ").slice(0, 260);
    return `- ${r.enriched_title || r.name} (${r.name}): ${text}`;
  }).join("\n");
}

async function voiceSamples(supabase: Supabase): Promise<string> {
  const { data } = await supabase.from("blog_posts").select("title, content").eq("status", "published").order("published_at", { ascending: false }).limit(2);
  return (data || []).map((p) => `### ${p.title}\n${(p.content || "").slice(0, 1200)}`).join("\n\n");
}

const WRITER_SYSTEM = (brief: EditorBrief) => `Du skriver ett blogginlägg på svenska i första person som bloggens författare.

Författaren: ${brief.positioning}
Läsare: ${brief.audience}
Röst: ${brief.voice}

Redaktionella regler:
- Ett inlägg, en tes. Driv tesen med konkreta exempel, siffror och författarens egen erfarenhet.
- Varje faktapåstående som kommer från research ska länkas inline som markdown-länk till källans URL, t.ex. [enligt Reuters](https://...). Använd ENBART URL:er ur källistan. Minst ${MIN_SOURCES} olika källor.
- Inga metaforkedjor, inga rubriker på formen "Den Digitala X:", inga tomma superlativ, ingen "i en värld där".
- Ta upp det starkaste motargumentet och bemöt det.
- Skriv aldrig ut etiketter som "Tes:" eller "Slutsats:" i löptexten – tesen ska framgå av texten.
- Påstå bara erfarenheter, roller och projekt som står i profilen ovan eller i trovärdighetsraden. Hitta inte på anekdoter, siffror eller händelser. Nämns ett eget projekt ska läsaren få veta i en bisats vad det är.
- Egna projekt får bara beskrivas med fakta ur listan FÖRFATTARENS PROJEKT. Tillskriv aldrig ett projekt funktioner, arkitektur eller resultat som inte står där. Passar inget projekt poängen, nämn inget.
- 900–1400 ord. Mellanrubriker (##) där de hjälper läsaren.
- Avsluta med en konkret slutsats eller handlingsråd riktat till läsaren. Koppla gärna till författarens arbete (${brief.offering}) som erfarenhet, aldrig som erbjudande eller uppmaning att höra av sig.

Utdataformat (exakt):
# [Titel, max 70 tecken, konkret – inte metaforisk]

[Inlägget i markdown]

---
METADATA:
title: [SEO-titel, max 60 tecken]
excerpt: [max 160 tecken]
seo_description: [max 160 tecken]
seo_keywords: [kommaseparerade]`;

function writerPrompt(pick: TopicPick, sources: Source[], samples: string, titles: string[], projects: string, feedback?: string): string {
  return `ÄMNE: ${pick.topic}
TES: ${pick.thesis}
FÖRFATTARENS TROVÄRDIGHET: ${pick.why_this_author}

FÖRFATTARENS PROJEKT (de enda tillåtna beskrivningarna av egna projekt):
${projects}

KÄLLOR (använd endast dessa URL:er):
${sources.map((s) => `[${s.n}] ${s.title} – ${s.url}\n${s.text.replace(/\s+/g, " ").slice(0, 1800)}`).join("\n\n")}

RÖSTPROV (författarens tidigare texter – matcha tonen, inte innehållet):
${samples}

TITLAR SOM INTE FÅR UPPREPAS ELLER LIKNAS:
${titles.slice(0, 40).map((t) => `- ${t}`).join("\n")}
${feedback ? `\nREVISION – åtgärda följande från granskningen av förra versionen:\n${feedback}` : ""}`;
}

// ---------- 5. quality gate ----------

function parseDraft(raw: string): DraftToSave {
  const metaIdx = raw.indexOf("METADATA:");
  const body = (metaIdx > 0 ? raw.slice(0, metaIdx).replace(/---\s*$/, "") : raw).trim();
  const title = body.split("\n").find((l) => l.startsWith("# "))?.replace(/^# /, "").trim() || "";
  const meta = metaIdx > 0 ? raw.slice(metaIdx) : "";
  const m = (k: string) => meta.match(new RegExp(`${k}:\\s*(.+)`))?.[1]?.trim() || "";
  const content = body.replace(/^# .+\n/, "").trim();
  return {
    title,
    content,
    excerpt: m("excerpt") || content.replace(/[#*[\]()]/g, "").slice(0, 155),
    seoTitle: m("title") || title,
    seoDescription: m("seo_description") || m("excerpt"),
    seoKeywords: m("seo_keywords").split(",").map((k) => k.trim()).filter(Boolean),
  };
}

function words(s: string): Set<string> {
  return new Set(s.toLowerCase().replace(/[^a-zåäö0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 3));
}

function similarity(a: string, b: string): number {
  const A = words(a), B = words(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  A.forEach((w) => { if (B.has(w)) inter++; });
  return inter / (A.size + B.size - inter);
}

function mechanicalChecks(draft: DraftToSave, sources: Source[], titles: string[]): string[] {
  const issues: string[] = [];
  const allowed = new Set(sources.map((s) => s.url.replace(/\/$/, "")));
  const links = [...draft.content.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)].map((m) => m[1].replace(/\/$/, ""));
  const used = new Set(links.filter((l) => allowed.has(l)));
  const invented = [...new Set(links.filter((l) => !allowed.has(l)))];
  const wordCount = draft.content.split(/\s+/).filter(Boolean).length;

  if (!draft.title) issues.push("Titel saknas.");
  if (/^den digitala/i.test(draft.title)) issues.push('Titeln följer den förbjudna mallen "Den Digitala X".');
  const close = titles.find((t) => similarity(t, draft.title) > 0.5);
  if (close) issues.push(`Titeln liknar för mycket en befintlig titel: "${close}".`);
  if (used.size < MIN_SOURCES) issues.push(`Endast ${used.size} källor från källistan är länkade; minst ${MIN_SOURCES} krävs.`);
  if (invented.length) issues.push(`Länkar som inte finns i källistan (ta bort eller ersätt): ${invented.join(", ")}`);
  if (wordCount < MIN_WORDS) issues.push(`För kort: ${wordCount} ord (minst ${MIN_WORDS}).`);
  if (wordCount > MAX_WORDS) issues.push(`För långt: ${wordCount} ord (högst ${MAX_WORDS}).`);
  return issues;
}

interface Review { score: number; issues: string[] }

async function review(draft: DraftToSave, pick: TopicPick, brief: EditorBrief, projects: string): Promise<Review> {
  const r = await chatJson<Review>(
    `Du är en sträng redaktör. Bedöm utkastet 1–10 där 7 betyder "publicerbart efter lätt redigering".
Dagens datum är ${new Date().toISOString().slice(0, 10)}. Källorna kommer från en riktig webbsökning: datum fram till idag är inte påhittade.
Kontrollera särskilt varje påstående om författarens egna projekt mot projektlistan nedan. Ett påhittat eller felaktigt påstående om ett eget projekt (funktion, arkitektur, resultat) är ett allvarligt fel: ange det som brist och sätt högst 4.
Kriterier: (1) en tydlig, icke-uppenbar tes, (2) konkreta fakta och exempel istället för allmänna påståenden, (3) relevans för författarens profil och målgrupp, (4) originalitet – inte AI-mall, inte metaforkedjor, (5) språk och struktur.
Svara ENBART med JSON: {"score": <heltal 1-10>, "issues": ["konkreta, åtgärdbara brister"]}`,
    `Författarprofil: ${brief.positioning}\nMålgrupp: ${brief.audience}\nAvsedd tes: ${pick.thesis}\n\nFÖRFATTARENS PROJEKT:\n${projects}\n\n# ${draft.title}\n\n${draft.content}`,
    WRITER_MODEL,
  );
  return { score: Number(r.score) || 0, issues: r.issues || [] };
}

// ---------- orchestration ----------

type Phase = "start" | "write" | "review" | "decide" | "save";

interface DraftState {
  phase: Phase;
  hops: number;
  pick?: TopicPick;
  sources?: Source[];
  draft?: DraftToSave;
  issues?: string[];
  rev?: Review;
  feedback?: string;
  attempts: Array<{ issues: string[]; score: number }>;
  /** Model calls in this task that hit the time limit and were retried. */
  timeouts?: number;
}

/**
 * The weekly draft, as a sequence of phases whose state lives on the task.
 * A slow private model can take minutes per call, so after HANDOFF_AFTER_S
 * an invocation saves its state and lets a new invocation continue
 * (deps.continueLater); without it, everything runs in one invocation.
 */
export async function handleEditorDraft(
  supabase: Supabase,
  deps: EditorDeps,
  opts: { topic?: string; rebuildBrief?: boolean; taskId?: string; resume?: boolean } = {},
) {
  const taskId = opts.taskId || crypto.randomUUID();
  let log: Record<string, unknown> = {};
  let state: DraftState = { phase: "start", hops: 0, attempts: [] };

  if (opts.resume) {
    const { data: task } = await supabase.from("agent_tasks").select("status, input_data, output_data").eq("id", taskId).maybeSingle();
    if (!task || task.status !== "running") return { success: false, taskId, error: "Nothing to resume" };
    log = (task.output_data || {}) as Record<string, unknown>;
    state = (log.state as DraftState) || state;
    opts.topic = opts.topic ?? ((task.input_data as Record<string, unknown>)?.forced_topic as string | undefined) ?? undefined;
  } else {
    await supabase.from("agent_tasks").insert({
      id: taskId, task_type: "blog_draft", status: "running",
      input_data: { mode: "editor", forced_topic: opts.topic || null },
    });
  }

  const started = Date.now();
  callDeadline = started + CALL_BUDGET_S * 1000;
  const elapsed = () => Math.round((Date.now() - started) / 1000);
  const persist = async () => {
    log.stage = state.phase;
    log.stage_at = new Date().toISOString();
    log.state = state;
    await supabase.from("agent_tasks").update({ output_data: { ...log } }).eq("id", taskId);
  };
  const finish = async (status: string, extra: Record<string, unknown>) => {
    delete log.state;
    await supabase.from("agent_tasks").update({
      status, completed_at: new Date().toISOString(), output_data: { ...log, ...extra },
    }).eq("id", taskId);
  };

  try {
    state.hops++;
    if (state.hops > MAX_HOPS) throw new Error(`Gave up after ${MAX_HOPS} hand-offs (phase ${state.phase})`);
    const brief = await getBrief(supabase, !!opts.rebuildBrief && state.phase === "start");
    const [titles, samples, projects] = await Promise.all([existingTitles(supabase), voiceSamples(supabase), projectFacts(supabase)]);
    const system = WRITER_SYSTEM(brief);
    const modelPhase = (p: Phase) => p === "start" || p === "write" || p === "review";

    while (true) {
      switch (state.phase) {
        case "start": {
          const { pick, news } = await pickTopic(brief, titles, opts.topic);
          log.pick = pick;
          const sources = await research(pick, news);
          log.sources = sources.map((x) => ({ n: x.n, title: x.title, url: x.url }));
          if (sources.length < MIN_SOURCES) throw new Error(`För lite research: ${sources.length} källor`);
          state.pick = pick;
          state.sources = sources;
          state.phase = "write";
          break;
        }
        case "write": {
          state.draft = parseDraft(await chat(system, writerPrompt(state.pick!, state.sources!, samples, titles, projects, state.feedback), WRITER_MODEL));
          state.issues = mechanicalChecks(state.draft, state.sources!, titles);
          state.rev = undefined;
          state.phase = state.issues.length ? "decide" : "review";
          break;
        }
        case "review": {
          state.rev = await review(state.draft!, state.pick!, brief, projects);
          state.phase = "decide";
          break;
        }
        case "decide": {
          const issues = state.issues || [];
          const rev = state.rev || { score: 0, issues: [] };
          state.attempts.push({ issues: [...issues, ...rev.issues], score: rev.score });
          log.attempts = state.attempts;
          if (!issues.length && rev.score >= MIN_REVIEW_SCORE) {
            state.phase = "save";
          } else if (state.attempts.length < 2) {
            state.feedback = [...issues, ...rev.issues].map((i) => `- ${i}`).join("\n");
            state.phase = "write";
          } else {
            await finish("rejected", { reason: "Utkastet nådde inte kvalitetskraven efter en revision", title: state.draft?.title });
            return { success: false, taskId, rejected: true, title: state.draft?.title, attempts: state.attempts };
          }
          break;
        }
        case "save": {
          const draft = state.draft!;
          const score = state.rev?.score ?? 0;
          const saved = await deps.saveDraft(draft);
          const policy = await autoPublishPolicy(supabase);
          const publish = policy.enabled && score >= policy.minScore;
          if (publish) {
            const { error } = await supabase.from("blog_posts")
              .update({ status: "published", published_at: new Date().toISOString() })
              .eq("id", saved.postId);
            if (error) throw error;
          }
          await finish(publish ? "completed" : "needs_review", {
            blog_post_id: saved.postId, title: draft.title, slug: saved.slug, review_score: score, cover_image_url: saved.coverImageUrl,
            hops: state.hops,
            ...(publish ? { decision: "auto_published", decided_by: "autopilot", decision_note: `Score ${score} ≥ ${policy.minScore}` } : {}),
          });
          return { success: true, taskId, postId: saved.postId, title: draft.title, reviewScore: score, published: publish };
        }
      }
      await persist();
      // Hand the next model call to a fresh invocation when this one has run a while.
      const late = elapsed() > HANDOFF_AFTER_S && modelPhase(state.phase);
      if (late && deps.continueLater) {
        await deps.continueLater(taskId);
        return { success: true, taskId, continued: true, phase: state.phase };
      }
      if (elapsed() > NO_NEW_CALL_AFTER_S && modelPhase(state.phase)) {
        throw new Error(`Out of time before ${state.phase} (${elapsed()} s, no hand-off available)`);
      }
    }
  } catch (e) {
    // A model call that hung: try the same phase again in a fresh invocation (twice at most).
    if (e instanceof ModelTimeoutError && deps.continueLater && (state.timeouts ?? 0) < MAX_TIMEOUT_RETRIES) {
      state.timeouts = (state.timeouts ?? 0) + 1;
      log.last_timeout = { phase: state.phase, after_s: elapsed(), at: new Date().toISOString() };
      await persist();
      await deps.continueLater(taskId);
      return { success: true, taskId, continued: true, retry: state.timeouts, phase: state.phase };
    }
    await finish("failed", { error: e instanceof Error ? e.message : "Unknown error", failed_in: state.phase, hops: state.hops, timeouts: state.timeouts ?? 0 });
    throw e;
  } finally {
    callDeadline = 0;
  }
}
