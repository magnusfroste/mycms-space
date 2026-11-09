// ============================================
// CMS tools — everything the admin can do, as MCP tools
//
// External agents (Hermes, Claude, ChatGPT …) are the operators of this CMS.
// Each tool belongs to one scope; an API key only sees and can call the tools
// its scopes allow:
//   read      – read everything (incl. inbox, analytics, private knowledge)
//   content   – create/update content: blog drafts, pages & blocks, projects,
//               newsletter drafts, inbox triage
//   review    – approve/reject Autopilot work, publish posts, send newsletters
//   settings  – site settings, modules, navigation, automations
// Managing API keys and secrets is deliberately NOT possible through MCP.
// Every call is logged in mcp_activities by the server.
// ============================================

// deno-lint-ignore no-explicit-any
type Supabase = any;
type Scope = "read" | "content" | "review" | "settings";
type Args = Record<string, unknown>;

export const ALL_SCOPES: Scope[] = ["read", "content", "review", "settings"];

/** Map stored key scopes (incl. legacy tools:read / tools:call) to CMS scopes. */
export function effectiveScopes(stored: string[] | null | undefined): Set<Scope> {
  const s = new Set<Scope>();
  for (const v of stored || []) {
    if (v === "tools:call") ALL_SCOPES.forEach((x) => s.add(x)); // legacy keys: full access
    else if (v === "tools:read") s.add("read");
    else if ((ALL_SCOPES as string[]).includes(v)) s.add(v as Scope);
  }
  return s;
}

// Modules whose config holds secrets or can redirect data/credentials.
const SECRET_MODULES = new Set(["api_tokens", "gmail_signals"]);
const LOCKED_FOR_MCP_UPDATE = new Set(["api_tokens", "gmail_signals", "webhooks"]);
// Keys in the ai module that choose where requests (and API keys) go.
const AI_PROVIDER_KEYS = new Set(["integration", "active_integration", "webhook_url", "admin_ai_config", "admin_ai_provider"]);
const MEDIA_BUCKETS = ["blog-images", "featured-images", "about-me-images", "project-images", "cms-files"];
const MAX_TEXT = 200_000;

// ---------- helpers ----------

const str = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const int = (v: unknown, def: number, min: number, max: number) => {
  const n = typeof v === "number" ? Math.floor(v) : def;
  return Math.max(min, Math.min(max, n));
};
function need(args: Args, key: string, max = 500): string {
  const v = str(args[key], max);
  if (!v) throw new Error(`${key} is required.`);
  return v;
}
function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[åä]/g, "a").replace(/ö/g, "o").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90);
}
const daysAgo = (d: number) => new Date(Date.now() - d * 86400_000).toISOString();
const json = (v: unknown) => JSON.stringify(v, null, 2);
function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}
async function audit(supabase: Supabase, table: string, recordId: string | null, oldData: unknown, by: string) {
  await supabase.from("settings_history").insert({ table_name: table, record_id: recordId, old_data: oldData ?? null, changed_by: by });
}

// ---------- tool table ----------

interface CmsTool {
  name: string;
  scope: Scope;
  description: string;
  inputSchema: Record<string, unknown>;
  run: (supabase: Supabase, args: Args, ctx: { author: string }) => Promise<unknown>;
}

const obj = (properties: Record<string, unknown> = {}, required: string[] = []) => ({ type: "object", properties, required });

const TOOLS: CmsTool[] = [
  // ======================= READ =======================
  {
    name: "site_overview",
    scope: "read",
    description: "START HERE. How the site is doing and what needs attention: inquiries this month (the north star), visitors, chats, review queue, failed Autopilot runs, stale knowledge base, unread inbox, 404 hits.",
    inputSchema: obj(),
    run: async (sb) => {
      const month = new Date(); month.setUTCDate(1); month.setUTCHours(0, 0, 0, 0);
      const prevMonth = new Date(month); prevMonth.setUTCMonth(prevMonth.getUTCMonth() - 1);
      const head = { count: "exact", head: true };
      const [inq, inqPrev, unread, views7, chats7, waiting, failed7, kb, drafts, notFound] = await Promise.all([
        sb.from("contact_messages").select("id", head).gte("created_at", month.toISOString()),
        sb.from("contact_messages").select("id", head).gte("created_at", prevMonth.toISOString()).lt("created_at", month.toISOString()),
        sb.from("contact_messages").select("id", head).eq("is_read", false),
        sb.from("page_views").select("visitor_id").gte("created_at", daysAgo(7)).limit(20000),
        sb.from("chat_messages").select("session_id").gte("created_at", daysAgo(7)).limit(20000),
        sb.from("agent_tasks").select("task_type").eq("status", "needs_review").limit(5000),
        sb.from("agent_tasks").select("id", head).eq("status", "failed").gte("created_at", daysAgo(7)),
        sb.from("knowledge_docs").select("updated_at").order("updated_at", { ascending: false }).limit(1),
        sb.from("blog_posts").select("id", head).eq("status", "draft"),
        sb.from("page_views").select("id", head).eq("page_slug", "404").gte("created_at", daysAgo(7)),
      ]);
      const visitors7 = new Set((views7.data || []).map((r: { visitor_id: string }) => r.visitor_id)).size;
      const chatSessions7 = new Set((chats7.data || []).map((r: { session_id: string }) => r.session_id)).size;
      const waitingByType: Record<string, number> = {};
      for (const t of waiting.data || []) waitingByType[t.task_type] = (waitingByType[t.task_type] || 0) + 1;
      const kbUpdated = kb.data?.[0]?.updated_at || null;
      const kbAgeDays = kbUpdated ? Math.floor((Date.now() - new Date(kbUpdated).getTime()) / 86400_000) : null;
      const attention: string[] = [];
      if ((unread.count || 0) > 0) attention.push(`${unread.count} unread inbox message(s) — inbox_list`);
      if ((waiting.data?.length || 0) > 0) attention.push(`${waiting.data!.length} Autopilot item(s) waiting for review — review_queue_list`);
      if ((failed7.count || 0) > 0) attention.push(`${failed7.count} failed Autopilot run(s) in 7 days — autopilot_status`);
      if (kbAgeDays !== null && kbAgeDays > 30) attention.push(`Knowledge base unchanged for ${kbAgeDays} days — kb_list / kb_append`);
      if ((notFound.count || 0) > 0) attention.push(`${notFound.count} visit(s) hit a 404 in 7 days — analytics_summary`);
      return {
        north_star: { inquiries_this_month: inq.count || 0, inquiries_last_month: inqPrev.count || 0 },
        last_7_days: { visitors: visitors7, chat_conversations: chatSessions7, page_404_hits: notFound.count || 0, failed_autopilot_runs: failed7.count || 0 },
        inbox_unread: unread.count || 0,
        review_queue: waitingByType,
        blog_drafts: drafts.count || 0,
        knowledge_base_last_updated: kbUpdated,
        needs_attention: attention,
      };
    },
  },
  {
    name: "blog_list",
    scope: "read",
    description: "List blog posts (newest first). Filter by status (draft, published, scheduled) or search the title.",
    inputSchema: obj({ status: { type: "string" }, search: { type: "string" }, limit: { type: "number" } }),
    run: async (sb, a) => {
      let q = sb.from("blog_posts").select("id, slug, title, excerpt, status, published_at, scheduled_for, source, updated_at")
        .order("updated_at", { ascending: false }).limit(int(a.limit, 25, 1, 100));
      if (str(a.status)) q = q.eq("status", str(a.status));
      if (str(a.search)) q = q.ilike("title", `%${str(a.search, 100)}%`);
      const { data, error } = await q;
      if (error) throw error;
      return { count: data.length, posts: data };
    },
  },
  {
    name: "blog_get",
    scope: "read",
    description: "Read one blog post in full (markdown content, SEO fields, categories) by slug.",
    inputSchema: obj({ slug: { type: "string" } }, ["slug"]),
    run: async (sb, a) => {
      const { data, error } = await sb.from("blog_posts").select("*, blog_post_categories(blog_categories(slug, name))").eq("slug", need(a, "slug")).maybeSingle();
      if (error) throw error;
      return data || { error: `No post '${a.slug}'.` };
    },
  },
  {
    name: "pages_list",
    scope: "read",
    description: "List the site's pages with how many blocks each has. Pages are ordered lists of typed blocks.",
    inputSchema: obj(),
    run: async (sb) => {
      const [{ data: pages }, { data: blocks }] = await Promise.all([
        sb.from("pages").select("slug, title, description, is_main_landing, enabled, updated_at").order("slug"),
        sb.from("page_blocks").select("page_slug, enabled"),
      ]);
      return (pages || []).map((p: { slug: string }) => ({
        ...p,
        blocks: (blocks || []).filter((b: { page_slug: string }) => b.page_slug === p.slug).length,
      }));
    },
  },
  {
    name: "page_get",
    scope: "read",
    description: "Read a page and its blocks in render order (id, block_type, enabled, block_config). Edit blocks with page_block_update / page_block_add / page_block_move / page_block_delete.",
    inputSchema: obj({ slug: { type: "string", description: "Page slug, e.g. 'home'." } }, ["slug"]),
    run: async (sb, a) => {
      const slug = need(a, "slug");
      const [{ data: page }, { data: blocks, error }] = await Promise.all([
        sb.from("pages").select("*").eq("slug", slug).maybeSingle(),
        sb.from("page_blocks").select("id, block_type, enabled, order_index, block_config, updated_at").eq("page_slug", slug).order("order_index"),
      ]);
      if (error) throw error;
      if (!page) return { error: `No page '${slug}'.` };
      return { page, blocks };
    },
  },
  {
    name: "block_types",
    scope: "read",
    description: "List the block types in use with one example config each, so you know which fields a block takes before adding or editing one.",
    inputSchema: obj(),
    run: async (sb) => {
      const { data } = await sb.from("page_blocks").select("block_type, block_config").order("updated_at", { ascending: false });
      const seen: Record<string, unknown> = {};
      for (const b of data || []) if (!(b.block_type in seen)) seen[b.block_type] = b.block_config;
      return Object.entries(seen).map(([block_type, example_config]) => ({ block_type, example_config }));
    },
  },
  {
    name: "projects_list",
    scope: "read",
    description: "List all GitHub projects incl. hidden ones, with enrichment fields and featured/enabled flags.",
    inputSchema: obj({ include_hidden: { type: "boolean" } }),
    run: async (sb, a) => {
      let q = sb.from("github_repos").select("name, enriched_title, enriched_description, problem_statement, why_it_matters, language, stars, topics, enabled, featured, order_index, pushed_at").order("pushed_at", { ascending: false });
      if (!a.include_hidden) q = q.eq("enabled", true);
      const { data, error } = await q;
      if (error) throw error;
      return { count: data.length, projects: data };
    },
  },
  {
    name: "inbox_list",
    scope: "read",
    description: "Contact messages from the site (newest first). These are the inquiries the north star counts.",
    inputSchema: obj({ unread_only: { type: "boolean" }, limit: { type: "number" } }),
    run: async (sb, a) => {
      let q = sb.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(int(a.limit, 20, 1, 100));
      if (a.unread_only) q = q.eq("is_read", false);
      const { data, error } = await q;
      if (error) throw error;
      return { count: data.length, messages: data };
    },
  },
  {
    name: "conversations_list",
    scope: "read",
    description: "Recent chat conversations visitors had with Magnet: session id, message count, first question, last activity.",
    inputSchema: obj({ days: { type: "number" }, limit: { type: "number" } }),
    run: async (sb, a) => {
      const { data, error } = await sb.from("chat_messages").select("session_id, role, content, created_at")
        .gte("created_at", daysAgo(int(a.days, 14, 1, 365))).order("created_at").limit(5000);
      if (error) throw error;
      const by: Record<string, { session_id: string; messages: number; first_question: string; last_at: string }> = {};
      for (const m of data || []) {
        const s = by[m.session_id] ||= { session_id: m.session_id, messages: 0, first_question: "", last_at: m.created_at };
        s.messages++;
        s.last_at = m.created_at;
        if (!s.first_question && m.role === "user") s.first_question = String(m.content).slice(0, 200);
      }
      const list = Object.values(by).sort((x, y) => y.last_at.localeCompare(x.last_at)).slice(0, int(a.limit, 20, 1, 100));
      return { count: list.length, conversations: list };
    },
  },
  {
    name: "conversation_get",
    scope: "read",
    description: "Read one chat conversation in full by session_id.",
    inputSchema: obj({ session_id: { type: "string" } }, ["session_id"]),
    run: async (sb, a) => {
      const { data, error } = await sb.from("chat_messages").select("role, content, created_at").eq("session_id", need(a, "session_id")).order("created_at");
      if (error) throw error;
      return { messages: data };
    },
  },
  {
    name: "analytics_summary",
    scope: "read",
    description: "Traffic for the last N days: visitors, page views, top pages, top referrers, 404 hits.",
    inputSchema: obj({ days: { type: "number", description: "Default 7, max 90." } }),
    run: async (sb, a) => {
      const days = int(a.days, 7, 1, 90);
      const { data, error } = await sb.from("page_views").select("page_slug, visitor_id, referrer").gte("created_at", daysAgo(days)).limit(50000);
      if (error) throw error;
      const pages: Record<string, number> = {}, refs: Record<string, number> = {};
      for (const v of data || []) {
        pages[v.page_slug] = (pages[v.page_slug] || 0) + 1;
        if (v.referrer) {
          let host = v.referrer;
          try { host = new URL(v.referrer).host; } catch { /* keep raw */ }
          refs[host] = (refs[host] || 0) + 1;
        }
      }
      const top = (o: Record<string, number>) => Object.entries(o).sort((x, y) => y[1] - x[1]).slice(0, 10).map(([k, n]) => ({ key: k, count: n }));
      return {
        days,
        page_views: data?.length || 0,
        visitors: new Set((data || []).map((v: { visitor_id: string }) => v.visitor_id)).size,
        page_404_hits: pages["404"] || 0,
        top_pages: top(pages),
        top_referrers: top(refs),
      };
    },
  },
  {
    name: "review_queue_list",
    scope: "read",
    description: "Work Autopilot has produced that waits for a decision (blog drafts, newsletter drafts …). Decide with review_decide.",
    inputSchema: obj({ task_type: { type: "string" }, limit: { type: "number" } }),
    run: async (sb, a) => {
      let q = sb.from("agent_tasks").select("id, task_type, created_at, input_data, output_data").eq("status", "needs_review")
        .order("created_at", { ascending: false }).limit(int(a.limit, 20, 1, 100));
      if (str(a.task_type)) q = q.eq("task_type", str(a.task_type));
      const { data, error } = await q;
      if (error) throw error;
      return {
        count: data.length,
        items: (data || []).map((t: { id: string; task_type: string; created_at: string; input_data: Args; output_data: Args }) => ({
          id: t.id, type: t.task_type, created_at: t.created_at,
          title: t.output_data?.title || t.output_data?.subject || t.input_data?.topic || null,
          slug: t.output_data?.slug || null,
          review_score: t.output_data?.review_score ?? null,
        })),
      };
    },
  },
  {
    name: "autopilot_status",
    scope: "read",
    description: "Autopilot's health: automations (trigger, last run, run count, last error), queue size, failed runs and active objectives.",
    inputSchema: obj(),
    run: async (sb) => {
      const head = { count: "exact", head: true };
      const [autos, waiting, failed7, objectives] = await Promise.all([
        sb.from("agent_automations").select("id, name, enabled, trigger_type, trigger_config, skill_name, last_triggered_at, run_count, last_error").order("name"),
        sb.from("agent_tasks").select("id", head).eq("status", "needs_review"),
        sb.from("agent_tasks").select("id", head).eq("status", "failed").gte("created_at", daysAgo(7)),
        sb.from("agent_objectives").select("id, goal, status, progress").eq("status", "active"),
      ]);
      return { waiting_for_review: waiting.count || 0, failed_last_7_days: failed7.count || 0, automations: autos.data || [], objectives: objectives.data || [] };
    },
  },
  {
    name: "settings_get",
    scope: "read",
    description: "Read a site module's settings (e.g. seo, branding, header, footer, ai, blog, projects, github, autopilot). Secret-holding modules are not readable.",
    inputSchema: obj({ module_type: { type: "string" } }, ["module_type"]),
    run: async (sb, a) => {
      const type = need(a, "module_type", 60);
      if (SECRET_MODULES.has(type)) return { error: `'${type}' holds secrets and is not available through MCP.` };
      const { data, error } = await sb.from("modules").select("module_type, enabled, module_config, updated_at").eq("module_type", type).maybeSingle();
      if (error) throw error;
      return data || { error: `No module '${type}'.` };
    },
  },
  {
    name: "modules_list",
    scope: "read",
    description: "List all modules with whether they are enabled.",
    inputSchema: obj(),
    run: async (sb) => {
      const { data, error } = await sb.from("modules").select("module_type, enabled, updated_at").order("module_type");
      if (error) throw error;
      return (data || []).filter((m: { module_type: string }) => !SECRET_MODULES.has(m.module_type));
    },
  },
  {
    name: "nav_list",
    scope: "read",
    description: "The header navigation links in order.",
    inputSchema: obj(),
    run: async (sb) => {
      const { data, error } = await sb.from("nav_links").select("id, label, url, order_index, enabled, is_external").order("order_index");
      if (error) throw error;
      return data;
    },
  },
  {
    name: "newsletter_overview",
    scope: "read",
    description: "Subscribers by status and the latest campaigns.",
    inputSchema: obj(),
    run: async (sb) => {
      const [{ data: subs }, { data: campaigns }] = await Promise.all([
        sb.from("newsletter_subscribers").select("status"),
        sb.from("newsletter_campaigns").select("id, subject, status, scheduled_for, sent_at, recipient_count, created_at").order("created_at", { ascending: false }).limit(20),
      ]);
      const byStatus: Record<string, number> = {};
      for (const s of subs || []) byStatus[s.status] = (byStatus[s.status] || 0) + 1;
      return { subscribers: byStatus, campaigns };
    },
  },
  {
    name: "media_list",
    scope: "read",
    description: `List files in a media bucket (${MEDIA_BUCKETS.join(", ")}) with public URLs.`,
    inputSchema: obj({ bucket: { type: "string", enum: MEDIA_BUCKETS }, prefix: { type: "string" }, limit: { type: "number" } }, ["bucket"]),
    run: async (sb, a) => {
      const bucket = need(a, "bucket", 40);
      if (!MEDIA_BUCKETS.includes(bucket)) throw new Error(`Unknown bucket '${bucket}'.`);
      const prefix = str(a.prefix, 200);
      const { data, error } = await sb.storage.from(bucket).list(prefix, { limit: int(a.limit, 50, 1, 200), sortBy: { column: "created_at", order: "desc" } });
      if (error) throw error;
      return (data || []).map((f: { name: string; metadata?: { size?: number }; created_at?: string }) => ({
        name: f.name, size: f.metadata?.size ?? null, created_at: f.created_at ?? null,
        url: bucket === "cms-files" ? null : sb.storage.from(bucket).getPublicUrl(prefix ? `${prefix}/${f.name}` : f.name).data.publicUrl,
      }));
    },
  },
  {
    name: "activity_log",
    scope: "read",
    description: "What changed recently and who changed it: settings history and MCP calls by operators.",
    inputSchema: obj({ limit: { type: "number" } }),
    run: async (sb, a) => {
      const limit = int(a.limit, 30, 1, 100);
      const [{ data: changes }, { data: calls }] = await Promise.all([
        sb.from("settings_history").select("table_name, record_id, changed_by, changed_at").order("changed_at", { ascending: false }).limit(limit),
        sb.from("mcp_activities").select("key_name, method, tool_name, status, created_at").eq("method", "tools/call").order("created_at", { ascending: false }).limit(limit),
      ]);
      return { changes, mcp_calls: calls };
    },
  },

  // ======================= CONTENT =======================
  {
    name: "blog_upsert",
    scope: "content",
    description: "Create a blog post or update one by slug. Posts are saved as drafts; publishing needs blog_publish (review scope). Content is markdown. Omitted fields are left unchanged on update.",
    inputSchema: obj({
      slug: { type: "string", description: "Existing slug to update, or omit to derive one from the title." },
      title: { type: "string" }, content: { type: "string" }, excerpt: { type: "string" },
      cover_image_url: { type: "string" }, seo_title: { type: "string" }, seo_description: { type: "string" },
      seo_keywords: { type: "array", items: { type: "string" } }, featured: { type: "boolean" },
    }),
    run: async (sb, a, ctx) => {
      const slugArg = str(a.slug, 120);
      const { data: existing } = slugArg ? await sb.from("blog_posts").select("*").eq("slug", slugArg).maybeSingle() : { data: null };
      const row: Args = {};
      for (const k of ["title", "excerpt", "cover_image_url", "seo_title", "seo_description"]) if (typeof a[k] === "string") row[k] = str(a[k], 1000);
      if (typeof a.content === "string") {
        if (a.content.length > MAX_TEXT) throw new Error("content is too long.");
        row.content = a.content;
        row.reading_time_minutes = Math.max(1, Math.round(a.content.split(/\s+/).length / 220));
      }
      if (Array.isArray(a.seo_keywords)) row.seo_keywords = a.seo_keywords.map((k) => String(k).slice(0, 60)).slice(0, 20);
      if (typeof a.featured === "boolean") row.featured = a.featured;
      if (existing) {
        await audit(sb, "blog_posts", existing.id, existing, ctx.author);
        const { data, error } = await sb.from("blog_posts").update(row).eq("id", existing.id).select("id, slug, title, status, updated_at").single();
        if (error) throw error;
        return { status: "updated", post: data };
      }
      const title = need(a, "title", 300);
      const slug = slugArg || slugify(title);
      const { data, error } = await sb.from("blog_posts").insert({ ...row, title, slug, status: "draft", source: `mcp:${ctx.author}` }).select("id, slug, title, status").single();
      if (error) throw error;
      return { status: "created", post: data, next: "Ask the owner, or use blog_publish with the review scope, to publish it." };
    },
  },
  {
    name: "page_block_update",
    scope: "content",
    description: "Change one block: merge fields into its config (default), replace the whole config, and/or switch it on or off. Read the block first with page_get.",
    inputSchema: obj({
      block_id: { type: "string" },
      config: { type: "object", description: "Fields to set." },
      mode: { type: "string", enum: ["merge", "replace"], description: "Default merge." },
      enabled: { type: "boolean" },
    }, ["block_id"]),
    run: async (sb, a, ctx) => {
      const id = need(a, "block_id", 60);
      const { data: block, error } = await sb.from("page_blocks").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!block) return { error: `No block '${id}'.` };
      const patch: Args = {};
      if (a.config !== undefined) {
        if (!isPlainObject(a.config)) throw new Error("config must be an object.");
        patch.block_config = a.mode === "replace" ? a.config : { ...(block.block_config || {}), ...a.config };
        if (JSON.stringify(patch.block_config).length > MAX_TEXT) throw new Error("config is too large.");
      }
      if (typeof a.enabled === "boolean") patch.enabled = a.enabled;
      if (!Object.keys(patch).length) return { error: "Nothing to change: pass config and/or enabled." };
      await audit(sb, "page_blocks", id, block, ctx.author);
      const { data, error: upErr } = await sb.from("page_blocks").update(patch).eq("id", id).select("id, page_slug, block_type, enabled, block_config").single();
      if (upErr) throw upErr;
      return { status: "updated", block: data };
    },
  },
  {
    name: "page_block_add",
    scope: "content",
    description: "Add a block to a page at a position (0 = top; default = last). See block_types for config examples.",
    inputSchema: obj({
      page_slug: { type: "string" }, block_type: { type: "string" },
      config: { type: "object" }, position: { type: "number" }, enabled: { type: "boolean" },
    }, ["page_slug", "block_type"]),
    run: async (sb, a, ctx) => {
      const page = need(a, "page_slug", 90);
      const type = need(a, "block_type", 60);
      if (!/^[a-z0-9-]+$/.test(type)) throw new Error("block_type must be lowercase letters, digits and dashes.");
      const config = a.config === undefined ? {} : a.config;
      if (!isPlainObject(config)) throw new Error("config must be an object.");
      const { data: blocks } = await sb.from("page_blocks").select("id, order_index").eq("page_slug", page).order("order_index");
      const list = blocks || [];
      const pos = int(a.position, list.length, 0, list.length);
      const { data, error } = await sb.from("page_blocks").insert({
        page_slug: page, block_type: type, block_config: config, enabled: a.enabled !== false, order_index: pos,
      }).select("id, block_type, order_index").single();
      if (error) throw error;
      // Re-number so order_index is 0..n-1 with the new block at pos.
      const ordered = [...list.slice(0, pos), { id: data.id }, ...list.slice(pos)];
      await Promise.all(ordered.map((b, i) => sb.from("page_blocks").update({ order_index: i }).eq("id", b.id)));
      await audit(sb, "page_blocks", data.id, null, ctx.author);
      return { status: "added", block: { ...data, order_index: pos } };
    },
  },
  {
    name: "page_block_move",
    scope: "content",
    description: "Move a block to a new position on its page (0 = top).",
    inputSchema: obj({ block_id: { type: "string" }, position: { type: "number" } }, ["block_id", "position"]),
    run: async (sb, a, ctx) => {
      const id = need(a, "block_id", 60);
      const { data: block } = await sb.from("page_blocks").select("id, page_slug").eq("id", id).maybeSingle();
      if (!block) return { error: `No block '${id}'.` };
      const { data: blocks } = await sb.from("page_blocks").select("id, order_index").eq("page_slug", block.page_slug).order("order_index");
      const rest = (blocks || []).filter((b: { id: string }) => b.id !== id);
      const pos = int(a.position, rest.length, 0, rest.length);
      const ordered = [...rest.slice(0, pos), { id }, ...rest.slice(pos)];
      await Promise.all(ordered.map((b, i) => sb.from("page_blocks").update({ order_index: i }).eq("id", b.id)));
      await audit(sb, "page_blocks", id, { order: (blocks || []).map((b: { id: string }) => b.id) }, ctx.author);
      return { status: "moved", page_slug: block.page_slug, order: ordered.map((b) => b.id) };
    },
  },
  {
    name: "page_block_delete",
    scope: "content",
    description: "Delete a block. Its last config is kept in the activity log. Prefer page_block_update with enabled:false if you may want it back.",
    inputSchema: obj({ block_id: { type: "string" } }, ["block_id"]),
    run: async (sb, a, ctx) => {
      const id = need(a, "block_id", 60);
      const { data: block } = await sb.from("page_blocks").select("*").eq("id", id).maybeSingle();
      if (!block) return { error: `No block '${id}'.` };
      await audit(sb, "page_blocks", id, block, ctx.author);
      const { error } = await sb.from("page_blocks").delete().eq("id", id);
      if (error) throw error;
      return { status: "deleted", block_id: id };
    },
  },
  {
    name: "project_update",
    scope: "content",
    description: "Edit a project's presentation by repo name: enriched title/description, problem statement, why it matters, featured, visible (enabled), sort order.",
    inputSchema: obj({
      name: { type: "string", description: "Repository name, e.g. 'private-ai-portal'." },
      enriched_title: { type: "string" }, enriched_description: { type: "string" },
      problem_statement: { type: "string" }, why_it_matters: { type: "string" },
      featured: { type: "boolean" }, enabled: { type: "boolean" }, order_index: { type: "number" },
    }, ["name"]),
    run: async (sb, a, ctx) => {
      const name = need(a, "name", 120);
      const { data: repo } = await sb.from("github_repos").select("*").eq("name", name).maybeSingle();
      if (!repo) return { error: `No project '${name}'.` };
      const patch: Args = {};
      for (const k of ["enriched_title", "enriched_description", "problem_statement", "why_it_matters"]) if (typeof a[k] === "string") patch[k] = str(a[k], 5000);
      for (const k of ["featured", "enabled"]) if (typeof a[k] === "boolean") patch[k] = a[k];
      if (typeof a.order_index === "number") patch.order_index = Math.floor(a.order_index);
      if (!Object.keys(patch).length) return { error: "Nothing to change." };
      await audit(sb, "github_repos", repo.id, repo, ctx.author);
      const { data, error } = await sb.from("github_repos").update(patch).eq("id", repo.id).select("name, enriched_title, featured, enabled, order_index").single();
      if (error) throw error;
      return { status: "updated", project: data };
    },
  },
  {
    name: "inbox_mark",
    scope: "content",
    description: "Mark a contact message as read or unread.",
    inputSchema: obj({ id: { type: "string" }, read: { type: "boolean" } }, ["id", "read"]),
    run: async (sb, a) => {
      const { data, error } = await sb.from("contact_messages").update({ is_read: a.read === true }).eq("id", need(a, "id", 60)).select("id, is_read").maybeSingle();
      if (error) throw error;
      return data ? { status: "updated", message: data } : { error: "No such message." };
    },
  },
  {
    name: "newsletter_draft",
    scope: "content",
    description: "Create or update a newsletter campaign draft (markdown/HTML content). Sending needs newsletter_send (review scope).",
    inputSchema: obj({ campaign_id: { type: "string" }, subject: { type: "string" }, content: { type: "string" } }, ["subject", "content"]),
    run: async (sb, a, ctx) => {
      const row = { subject: need(a, "subject", 300), content: need(a, "content", MAX_TEXT), agent_notes: `Written by ${ctx.author}` };
      if (str(a.campaign_id)) {
        const { data, error } = await sb.from("newsletter_campaigns").update(row).eq("id", str(a.campaign_id, 60)).eq("status", "draft").select("id, subject, status").maybeSingle();
        if (error) throw error;
        return data ? { status: "updated", campaign: data } : { error: "No draft campaign with that id." };
      }
      const { data, error } = await sb.from("newsletter_campaigns").insert({ ...row, status: "draft" }).select("id, subject, status").single();
      if (error) throw error;
      return { status: "created", campaign: data };
    },
  },

  // ======================= REVIEW =======================
  {
    name: "review_decide",
    scope: "review",
    description: "Approve or reject items in the review queue. Approving a blog draft publishes the post; approving a newsletter draft marks it ready (send with newsletter_send). Rejecting archives the draft.",
    inputSchema: obj({
      task_ids: { type: "array", items: { type: "string" }, description: "One or more ids from review_queue_list (max 50)." },
      decision: { type: "string", enum: ["approve", "reject"] },
      note: { type: "string" },
    }, ["task_ids", "decision"]),
    run: async (sb, a, ctx) => {
      const ids = Array.isArray(a.task_ids) ? a.task_ids.map(String).slice(0, 50) : [];
      if (!ids.length) throw new Error("task_ids is required.");
      const approve = a.decision === "approve";
      if (!approve && a.decision !== "reject") throw new Error("decision must be approve or reject.");
      const { data: tasks } = await sb.from("agent_tasks").select("*").in("id", ids).eq("status", "needs_review");
      const results = [];
      for (const t of tasks || []) {
        const out = t.output_data || {};
        if (t.task_type === "blog_draft" && out.blog_post_id) {
          await sb.from("blog_posts").update(approve
            ? { status: "published", published_at: new Date().toISOString() }
            : { status: "archived" }).eq("id", out.blog_post_id);
        }
        await sb.from("agent_tasks").update({
          status: approve ? "completed" : "rejected",
          completed_at: new Date().toISOString(),
          output_data: { ...out, decision: a.decision, decided_by: ctx.author, decision_note: str(a.note, 1000) || null },
        }).eq("id", t.id);
        results.push({ id: t.id, type: t.task_type, decision: a.decision, title: out.title || out.subject || null });
      }
      const missing = ids.filter((id) => !(tasks || []).some((t: { id: string }) => t.id === id));
      return { decided: results, not_found_or_not_waiting: missing };
    },
  },
  {
    name: "blog_publish",
    scope: "review",
    description: "Publish a blog post now, or schedule it with publish_at (ISO time). unpublish:true turns it back into a draft.",
    inputSchema: obj({ slug: { type: "string" }, publish_at: { type: "string" }, unpublish: { type: "boolean" } }, ["slug"]),
    run: async (sb, a, ctx) => {
      const { data: post } = await sb.from("blog_posts").select("*").eq("slug", need(a, "slug", 120)).maybeSingle();
      if (!post) return { error: `No post '${a.slug}'.` };
      let patch: Args;
      if (a.unpublish) patch = { status: "draft", published_at: null, scheduled_for: null };
      else if (str(a.publish_at)) {
        const when = new Date(str(a.publish_at));
        if (isNaN(when.getTime())) throw new Error("publish_at is not a valid date.");
        patch = when > new Date() ? { status: "scheduled", scheduled_for: when.toISOString() } : { status: "published", published_at: when.toISOString() };
      } else patch = { status: "published", published_at: new Date().toISOString() };
      await audit(sb, "blog_posts", post.id, post, ctx.author);
      const { data, error } = await sb.from("blog_posts").update(patch).eq("id", post.id).select("slug, status, published_at, scheduled_for").single();
      if (error) throw error;
      return { status: "ok", post: data };
    },
  },
  {
    name: "newsletter_send",
    scope: "review",
    description: "Send a newsletter campaign to all active subscribers. Irreversible — confirm with the owner first unless told otherwise.",
    inputSchema: obj({ campaign_id: { type: "string" }, confirm: { type: "boolean", description: "Must be true." } }, ["campaign_id", "confirm"]),
    run: async (_sb, a) => {
      if (a.confirm !== true) return { error: "Set confirm:true to send. This emails every active subscriber." };
      const res = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-newsletter`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` },
        body: JSON.stringify({ campaignId: need(a, "campaign_id", 60) }),
      });
      return await res.json();
    },
  },

  // ======================= SETTINGS =======================
  {
    name: "settings_update",
    scope: "settings",
    description: "Change a module's settings by merging fields into its config (e.g. seo titles, header/footer, blog or projects options, autopilot editor brief, Magnet's system prompt). Read it first with settings_get. Provider endpoints and secrets cannot be changed through MCP.",
    inputSchema: obj({ module_type: { type: "string" }, patch: { type: "object" } }, ["module_type", "patch"]),
    run: async (sb, a, ctx) => {
      const type = need(a, "module_type", 60);
      if (LOCKED_FOR_MCP_UPDATE.has(type)) return { error: `'${type}' can only be changed by the owner in the admin.` };
      if (!isPlainObject(a.patch)) throw new Error("patch must be an object.");
      if (type === "ai") {
        const blocked = Object.keys(a.patch).filter((k) => AI_PROVIDER_KEYS.has(k));
        if (blocked.length) return { error: `These ai settings can only be changed in the admin: ${blocked.join(", ")}.` };
      }
      const { data: mod } = await sb.from("modules").select("*").eq("module_type", type).maybeSingle();
      if (!mod) return { error: `No module '${type}'.` };
      const config = { ...(mod.module_config || {}), ...a.patch };
      if (JSON.stringify(config).length > MAX_TEXT) throw new Error("config is too large.");
      await audit(sb, "modules", mod.id, mod.module_config, ctx.author);
      const { error } = await sb.from("modules").update({ module_config: config }).eq("id", mod.id);
      if (error) throw error;
      return { status: "updated", module_type: type, changed_keys: Object.keys(a.patch) };
    },
  },
  {
    name: "module_toggle",
    scope: "settings",
    description: "Switch an optional module on or off (blog, projects, newsletter, ai, github, webhooks, chrome_extension). Core modules cannot be switched off.",
    inputSchema: obj({ module_type: { type: "string" }, enabled: { type: "boolean" } }, ["module_type", "enabled"]),
    run: async (sb, a, ctx) => {
      const type = need(a, "module_type", 60);
      const optional = new Set(["blog", "projects", "newsletter", "ai", "github", "webhooks", "chrome_extension"]);
      if (!optional.has(type)) return { error: `'${type}' is a core module or unknown.` };
      const { data: mod } = await sb.from("modules").select("id, enabled").eq("module_type", type).maybeSingle();
      if (!mod) return { error: `No module '${type}'.` };
      await audit(sb, "modules", mod.id, { enabled: mod.enabled }, ctx.author);
      await sb.from("modules").update({ enabled: a.enabled === true }).eq("id", mod.id);
      return { status: "ok", module_type: type, enabled: a.enabled === true };
    },
  },
  {
    name: "nav_update",
    scope: "settings",
    description: "Create, update or delete a navigation link. Pass id to update/delete; omit id to create.",
    inputSchema: obj({
      id: { type: "string" }, label: { type: "string" }, url: { type: "string" },
      order_index: { type: "number" }, enabled: { type: "boolean" }, is_external: { type: "boolean" }, delete: { type: "boolean" },
    }),
    run: async (sb, a, ctx) => {
      const id = str(a.id, 60);
      if (id) {
        const { data: link } = await sb.from("nav_links").select("*").eq("id", id).maybeSingle();
        if (!link) return { error: `No link '${id}'.` };
        await audit(sb, "nav_links", id, link, ctx.author);
        if (a.delete) { await sb.from("nav_links").delete().eq("id", id); return { status: "deleted", id }; }
        const patch: Args = {};
        for (const k of ["label", "url"]) if (typeof a[k] === "string") patch[k] = str(a[k], 300);
        for (const k of ["enabled", "is_external"]) if (typeof a[k] === "boolean") patch[k] = a[k];
        if (typeof a.order_index === "number") patch.order_index = Math.floor(a.order_index);
        const { data, error } = await sb.from("nav_links").update(patch).eq("id", id).select("*").single();
        if (error) throw error;
        return { status: "updated", link: data };
      }
      const { data, error } = await sb.from("nav_links").insert({
        label: need(a, "label", 120), url: need(a, "url", 300),
        order_index: typeof a.order_index === "number" ? Math.floor(a.order_index) : 99,
        enabled: a.enabled !== false, is_external: a.is_external === true,
      }).select("*").single();
      if (error) throw error;
      return { status: "created", link: data };
    },
  },
  {
    name: "automation_update",
    scope: "settings",
    description: "Turn an Autopilot automation on/off or change its schedule/trigger config. Find it with autopilot_status.",
    inputSchema: obj({ id: { type: "string" }, enabled: { type: "boolean" }, trigger_config: { type: "object" } }, ["id"]),
    run: async (sb, a, ctx) => {
      const id = need(a, "id", 60);
      const { data: auto } = await sb.from("agent_automations").select("*").eq("id", id).maybeSingle();
      if (!auto) return { error: `No automation '${id}'.` };
      const patch: Args = {};
      if (typeof a.enabled === "boolean") patch.enabled = a.enabled;
      if (a.trigger_config !== undefined) {
        if (!isPlainObject(a.trigger_config)) throw new Error("trigger_config must be an object.");
        patch.trigger_config = a.trigger_config;
      }
      if (!Object.keys(patch).length) return { error: "Nothing to change." };
      await audit(sb, "agent_automations", id, auto, ctx.author);
      const { data, error } = await sb.from("agent_automations").update(patch).eq("id", id).select("id, name, enabled, trigger_type, trigger_config").single();
      if (error) throw error;
      return { status: "updated", automation: data };
    },
  },
];

export const CMS_TOOLS = TOOLS.map(({ name, description, inputSchema, scope }) => ({
  name,
  description: `[${scope}] ${description}`,
  inputSchema,
  scope,
}));
export const CMS_TOOL_NAMES = new Set(TOOLS.map((t) => t.name));

/** MCP tool descriptors visible to a key with these scopes. */
export function cmsToolsFor(scopes: Set<Scope>) {
  return CMS_TOOLS.filter((t) => scopes.has(t.scope)).map(({ scope: _s, ...t }) => t);
}

export async function callCmsTool(
  supabase: Supabase,
  name: string,
  args: Args,
  ctx: { scopes: Set<Scope>; keyName: string | null },
): Promise<string> {
  const tool = TOOLS.find((t) => t.name === name);
  if (!tool) throw new Error(`Unknown CMS tool: ${name}`);
  if (!ctx.scopes.has(tool.scope)) {
    return json({ error: `${name} needs the '${tool.scope}' scope. Ask the owner to grant it in admin → Operators & Autopilot.` });
  }
  const result = await tool.run(supabase, args || {}, { author: `mcp:${ctx.keyName || "unknown"}` });
  return json(result);
}
