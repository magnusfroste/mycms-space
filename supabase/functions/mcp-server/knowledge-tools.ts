// ============================================
// Knowledge base tools – the owner's profile as markdown documents
//
// Any agent (Claude, ChatGPT, Hermes …) with an MCP key can maintain the
// knowledge base; the chat and the profile tools are grounded on it.
// Anonymous callers can only read public documents.
// Every update/delete keeps the previous version (knowledge_doc_versions).
// ============================================

// deno-lint-ignore no-explicit-any
type Supabase = any;

const MAX_DOC_CHARS = 60_000;

const WRITING_GUIDE = `Guidelines for writing: keep one area per document (e.g. "roles", "client-assignments", "projects", "case-studies", "skills", "problems-solved"). Write in markdown. For every role or assignment, start with one exact header line: "## <Title> — <Organisation> (<YYYY-MM> – <YYYY-MM or present>)" and never guess dates or titles. Only write facts the owner has given you. Use visibility "private" for anything with client names, figures or details the owner has not cleared for the public; the public chat can read "public" documents only.`;

export const KNOWLEDGE_TOOLS = [
  {
    name: "kb_list",
    description: "List the documents in the owner's knowledge base (slug, title, visibility, size, last update). Anonymous callers see public documents only.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "kb_get",
    description: "Read one knowledge base document in full by slug.",
    inputSchema: {
      type: "object",
      properties: { slug: { type: "string", description: "Document slug from kb_list." } },
      required: ["slug"],
    },
  },
  {
    name: "kb_upsert",
    description: `Create a document or replace its full content (requires an API key). Read it with kb_get first if it exists, so nothing is lost. ${WRITING_GUIDE}`,
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "Stable lowercase id, e.g. 'roles' or 'client-assignments'." },
        title: { type: "string", description: "Human readable title." },
        content: { type: "string", description: `Full markdown content (max ${MAX_DOC_CHARS} characters).` },
        visibility: { type: "string", enum: ["public", "private"], description: "Default private." },
        order_index: { type: "number", description: "Optional sort order (lower first)." },
      },
      required: ["slug", "title", "content"],
    },
  },
  {
    name: "kb_append",
    description: `Append a section to an existing document without touching the rest, e.g. one new assignment (requires an API key). ${WRITING_GUIDE}`,
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "Existing document slug." },
        content: { type: "string", description: "Markdown to append at the end." },
      },
      required: ["slug", "content"],
    },
  },
  {
    name: "kb_delete",
    description: "Delete a document (requires an API key). The last version is kept in the history and can be restored by the owner.",
    inputSchema: {
      type: "object",
      properties: { slug: { type: "string" } },
      required: ["slug"],
    },
  },
];

export const KNOWLEDGE_TOOL_NAMES = new Set(KNOWLEDGE_TOOLS.map((t) => t.name));
const WRITE_TOOLS = new Set(["kb_upsert", "kb_append", "kb_delete"]);

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[åä]/g, "a").replace(/ö/g, "o").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

export async function callKnowledgeTool(
  supabase: Supabase,
  name: string,
  args: Record<string, unknown>,
  ctx: { anonymous: boolean; keyName: string | null },
): Promise<string> {
  if (WRITE_TOOLS.has(name) && ctx.anonymous) {
    return JSON.stringify({ error: `${name} requires an API key. Ask the site owner to create one in admin → MCP.` });
  }
  const author = `mcp:${ctx.keyName || "unknown"}`;

  if (name === "kb_list") {
    let q = supabase.from("knowledge_docs").select("slug, title, visibility, content, updated_at, updated_by").order("order_index").order("title");
    if (ctx.anonymous) q = q.eq("visibility", "public");
    const { data, error } = await q;
    if (error) throw error;
    return JSON.stringify({
      count: data?.length || 0,
      documents: (data || []).map((d: { slug: string; title: string; visibility: string; content: string; updated_at: string; updated_by: string }) => ({
        slug: d.slug, title: d.title, visibility: d.visibility, chars: d.content.length, updated_at: d.updated_at, updated_by: d.updated_by,
      })),
      guide: ctx.anonymous ? undefined : WRITING_GUIDE,
    }, null, 2);
  }

  const slug = slugify(String(args.slug || ""));
  if (!slug) throw new Error("slug is required.");

  if (name === "kb_get") {
    let q = supabase.from("knowledge_docs").select("slug, title, visibility, content, updated_at, updated_by").eq("slug", slug);
    if (ctx.anonymous) q = q.eq("visibility", "public");
    const { data, error } = await q.maybeSingle();
    if (error) throw error;
    return JSON.stringify(data || { error: `No document '${slug}'.` }, null, 2);
  }

  if (name === "kb_upsert") {
    const title = String(args.title || "").trim().slice(0, 200);
    const content = String(args.content || "");
    if (!title) throw new Error("title is required.");
    if (content.length > MAX_DOC_CHARS) throw new Error(`content is too long (${content.length} > ${MAX_DOC_CHARS}). Split it into several documents.`);
    const visibility = args.visibility === "public" ? "public" : "private";
    const row: Record<string, unknown> = { slug, title, content, visibility, updated_by: author };
    if (typeof args.order_index === "number") row.order_index = args.order_index;
    const { data, error } = await supabase.from("knowledge_docs").upsert(row, { onConflict: "slug" }).select("slug, title, visibility, updated_at").single();
    if (error) throw error;
    return JSON.stringify({ status: "saved", ...data, chars: content.length }, null, 2);
  }

  if (name === "kb_append") {
    const addition = String(args.content || "").trim();
    if (!addition) throw new Error("content is required.");
    const { data: doc, error } = await supabase.from("knowledge_docs").select("content").eq("slug", slug).maybeSingle();
    if (error) throw error;
    if (!doc) return JSON.stringify({ error: `No document '${slug}'. Create it with kb_upsert first.` });
    const content = `${doc.content.trimEnd()}\n\n${addition}\n`;
    if (content.length > MAX_DOC_CHARS) throw new Error(`Document would exceed ${MAX_DOC_CHARS} characters. Start a new document.`);
    const { error: upErr } = await supabase.from("knowledge_docs").update({ content, updated_by: author }).eq("slug", slug);
    if (upErr) throw upErr;
    return JSON.stringify({ status: "appended", slug, chars: content.length });
  }

  if (name === "kb_delete") {
    await supabase.from("knowledge_docs").update({ updated_by: author }).eq("slug", slug);
    const { data, error } = await supabase.from("knowledge_docs").delete().eq("slug", slug).select("slug");
    if (error) throw error;
    return JSON.stringify(data?.length ? { status: "deleted", slug, note: "The last version is kept in the history." } : { error: `No document '${slug}'.` });
  }

  throw new Error(`Unknown knowledge tool: ${name}`);
}
