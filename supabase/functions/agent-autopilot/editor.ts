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
// ============================================

import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { callOpenAICompatible, resolveProvider } from "../_shared/ai-agent.ts";

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
const FAST_MODEL = "google/gemini-3-flash-preview";
const WRITER_MODEL = "google/gemini-2.5-pro";

// ---------- model helpers ----------

async function chat(system: string, user: string, model: string): Promise<string> {
  const { url, apiKey } = resolveProvider({ provider: "lovable" });
  try {
    const data = await callOpenAICompatible({
      url, apiKey, model,
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
    });
    return data.choices?.[0]?.message?.content || "";
  } catch (e) {
    if (model === FAST_MODEL) throw e;
    console.warn(`[editor] ${model} failed, falling back to ${FAST_MODEL}:`, e);
    return chat(system, user, FAST_MODEL);
  }
}

function parseJson<T>(raw: string): T {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  const start = cleaned.search(/[[{]/);
  const end = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
  if (start < 0 || end < start) throw new Error(`Model did not return JSON: ${raw.slice(0, 200)}`);
  return JSON.parse(cleaned.slice(start, end + 1)) as T;
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
  const [resume, repos, seo, posts] = await Promise.all([
    supabase.from("resume_entries").select("category, title, subtitle, description, tags, is_current").eq("enabled", true).order("order_index"),
    supabase.from("github_repos").select("name, enriched_title, enriched_description, why_it_matters, topics, stars, pushed_at").eq("enabled", true).order("pushed_at", { ascending: false }).limit(20),
    supabase.from("modules").select("module_config").eq("module_type", "seo").maybeSingle(),
    supabase.from("blog_posts").select("title, excerpt").eq("status", "published").order("published_at", { ascending: false }).limit(15),
  ]);

  const resumeText = (resume.data || []).map((r) =>
    `- [${r.category}${r.is_current ? ", nuvarande" : ""}] ${r.title}${r.subtitle ? ` – ${r.subtitle}` : ""}: ${(r.description || "").slice(0, 300)} ${r.tags?.length ? `(${r.tags.join(", ")})` : ""}`
  ).join("\n");
  const repoText = (repos.data || []).map((r) =>
    `- ${r.enriched_title || r.name}: ${(r.enriched_description || "").slice(0, 200)} ${r.why_it_matters ? `| Varför: ${r.why_it_matters.slice(0, 150)}` : ""}`
  ).join("\n");
  const seoCfg = (seo.data?.module_config || {}) as Record<string, string>;
  const postText = (posts.data || []).map((p) => `- ${p.title}`).join("\n");

  const raw = await chat(
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

CV:
${resumeText}

Egna projekt (GitHub):
${repoText}

Senast publicerade inlägg:
${postText}`,
    WRITER_MODEL,
  );

  const parsed = parseJson<Omit<EditorBrief, "built_at">>(raw);
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

  const raw = await chat(
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
  const pick = parseJson<TopicPick>(raw);
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
  return merged.slice(0, 10).map((s, i) => ({ n: i + 1, title: s.title, url: s.url, text: s.text }));
}

// ---------- 4. writing ----------

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

function writerPrompt(pick: TopicPick, sources: Source[], samples: string, titles: string[], feedback?: string): string {
  return `ÄMNE: ${pick.topic}
TES: ${pick.thesis}
FÖRFATTARENS TROVÄRDIGHET: ${pick.why_this_author}

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

async function review(draft: DraftToSave, pick: TopicPick, brief: EditorBrief): Promise<Review> {
  const raw = await chat(
    `Du är en sträng redaktör. Bedöm utkastet 1–10 där 7 betyder "publicerbart efter lätt redigering".
Kriterier: (1) en tydlig, icke-uppenbar tes, (2) konkreta fakta och exempel istället för allmänna påståenden, (3) relevans för författarens profil och målgrupp, (4) originalitet – inte AI-mall, inte metaforkedjor, (5) språk och struktur.
Svara ENBART med JSON: {"score": <heltal 1-10>, "issues": ["konkreta, åtgärdbara brister"]}`,
    `Författarprofil: ${brief.positioning}\nMålgrupp: ${brief.audience}\nAvsedd tes: ${pick.thesis}\n\n# ${draft.title}\n\n${draft.content}`,
    WRITER_MODEL,
  );
  const r = parseJson<Review>(raw);
  return { score: Number(r.score) || 0, issues: r.issues || [] };
}

// ---------- orchestration ----------

export async function handleEditorDraft(
  supabase: Supabase,
  deps: EditorDeps,
  opts: { topic?: string; rebuildBrief?: boolean } = {},
) {
  const taskId = crypto.randomUUID();
  await supabase.from("agent_tasks").insert({
    id: taskId, task_type: "blog_draft", status: "running",
    input_data: { mode: "editor", forced_topic: opts.topic || null },
  });

  const log: Record<string, unknown> = {};
  try {
    const brief = await getBrief(supabase, !!opts.rebuildBrief);
    const titles = await existingTitles(supabase);

    const { pick, news } = await pickTopic(brief, titles, opts.topic);
    log.pick = pick;

    const sources = await research(pick, news);
    log.sources = sources.map((s) => ({ n: s.n, title: s.title, url: s.url }));
    if (sources.length < MIN_SOURCES) throw new Error(`För lite research: ${sources.length} källor`);

    const samples = await voiceSamples(supabase);
    const system = WRITER_SYSTEM(brief);

    let draft = parseDraft(await chat(system, writerPrompt(pick, sources, samples, titles), WRITER_MODEL));
    let issues = mechanicalChecks(draft, sources, titles);
    let rev = issues.length ? { score: 0, issues: [] as string[] } : await review(draft, pick, brief);
    const attempts: Array<{ issues: string[]; score: number }> = [{ issues: [...issues, ...rev.issues], score: rev.score }];

    if (issues.length || rev.score < MIN_REVIEW_SCORE) {
      const feedback = [...issues, ...rev.issues].map((i) => `- ${i}`).join("\n");
      draft = parseDraft(await chat(system, writerPrompt(pick, sources, samples, titles, feedback), WRITER_MODEL));
      issues = mechanicalChecks(draft, sources, titles);
      rev = issues.length ? { score: 0, issues: [] } : await review(draft, pick, brief);
      attempts.push({ issues: [...issues, ...rev.issues], score: rev.score });
    }
    log.attempts = attempts;

    if (issues.length || rev.score < MIN_REVIEW_SCORE) {
      await supabase.from("agent_tasks").update({
        status: "rejected",
        completed_at: new Date().toISOString(),
        output_data: { ...log, reason: "Utkastet nådde inte kvalitetskraven efter en revision", title: draft.title },
      }).eq("id", taskId);
      return { success: false, taskId, rejected: true, title: draft.title, attempts };
    }

    const saved = await deps.saveDraft(draft);
    await supabase.from("agent_tasks").update({
      status: "needs_review",
      completed_at: new Date().toISOString(),
      output_data: { ...log, blog_post_id: saved.postId, title: draft.title, slug: saved.slug, review_score: rev.score, cover_image_url: saved.coverImageUrl },
    }).eq("id", taskId);

    return { success: true, taskId, postId: saved.postId, title: draft.title, reviewScore: rev.score };
  } catch (e) {
    await supabase.from("agent_tasks").update({
      status: "failed",
      output_data: { ...log, error: e instanceof Error ? e.message : "Unknown error" },
    }).eq("id", taskId);
    throw e;
  }
}
