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

const WRITING_GUIDE = `Guidelines for writing: keep one area per document (e.g. "roles", "client-assignments", "projects", "case-studies", "skills", "problems-solved"). Write in markdown. For every role or assignment, start with one exact header line: "## <Title> — <Organisation> (<YYYY-MM> – <YYYY-MM or present>)" and never guess dates or titles. Only write facts the owner has given you. Use visibility "private" for anything with client names, figures or details the owner has not cleared for the public; the public chat can read "public" documents only. Never put personal data in a public document: no phone numbers, personal email addresses, home address or neighbourhood, family details, health, salary, or names of private individuals (references, colleagues) — keep those in a private document such as "contact-and-search".`;

// Public documents feed the public chat and the open MCP tools. Refuse obvious
// personal data there; the agent can move it to a private document instead.
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const PHONE_RE = /(?:\+\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?){2,}\d{2,4}(?!\d)/g;
function isYearRange(digits: string): boolean {
  // "2003-2005", "(2022 – 2025)" … two 4-digit years, not a phone number.
  return /^(19|20)\d{2}(19|20)\d{2}$/.test(digits);
}
function findPublicPii(content: string): string | null {
  const email = content.match(EMAIL_RE);
  if (email) return `an email address ("${email[0]}")`;
  for (const m of content.matchAll(PHONE_RE)) {
    const digits = m[0].replace(/\D/g, "");
    if (digits.length < 8 || isYearRange(digits)) continue;
    return `a phone number ("${m[0].trim()}")`;
  }
  return null;
}

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
        visibility: { type: "string", enum: ["public", "private"], description: "Omit to keep the current visibility. New documents default to private." },
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
  ctx: { anonymous: boolean; keyName: string | null; author?: string },
): Promise<string> {
  if (WRITE_TOOLS.has(name) && ctx.anonymous) {
    return JSON.stringify({ error: `${name} requires an API key. Ask the site owner to create one in admin → MCP.` });
  }
  const author = ctx.author || `mcp:${ctx.keyName || "unknown"}`;

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
    // Keep the existing visibility unless the caller sets it explicitly,
    // so an edit never silently hides a public document from the chat.
    let visibility: string;
    if (args.visibility === "public" || args.visibility === "private") {
      visibility = args.visibility;
    } else {
      const { data: existing } = await supabase.from("knowledge_docs").select("visibility").eq("slug", slug).maybeSingle();
      visibility = existing?.visibility || "private";
    }
    if (visibility === "public") {
      const pii = findPublicPii(content);
      if (pii) return JSON.stringify({ error: `Not saved: this public document contains ${pii}. Remove it, or save that detail in a private document.` });
    }
    const row: Record<string, unknown> = { slug, title, content, visibility, updated_by: author };
    if (typeof args.order_index === "number") row.order_index = args.order_index;
    const { data, error } = await supabase.from("knowledge_docs").upsert(row, { onConflict: "slug" }).select("slug, title, visibility, updated_at").single();
    if (error) throw error;
    return JSON.stringify({ status: "saved", ...data, chars: content.length }, null, 2);
  }

  if (name === "kb_append") {
    const addition = String(args.content || "").trim();
    if (!addition) throw new Error("content is required.");
    // Optimistic concurrency: only write if nobody changed the doc since we
    // read it, so two agents appending at once never drop each other's text.
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data: doc, error } = await supabase.from("knowledge_docs").select("content, updated_at, visibility").eq("slug", slug).maybeSingle();
      if (error) throw error;
      if (!doc) return JSON.stringify({ error: `No document '${slug}'. Create it with kb_upsert first.` });
      if (doc.visibility === "public") {
        const pii = findPublicPii(addition);
        if (pii) return JSON.stringify({ error: `Not appended: '${slug}' is public and the text contains ${pii}. Remove it, or append it to a private document.` });
      }
      const content = `${doc.content.trimEnd()}\n\n${addition}\n`;
      if (content.length > MAX_DOC_CHARS) throw new Error(`Document would exceed ${MAX_DOC_CHARS} characters. Start a new document.`);
      const { data: updated, error: upErr } = await supabase.from("knowledge_docs")
        .update({ content, updated_by: author }).eq("slug", slug).eq("updated_at", doc.updated_at).select("slug");
      if (upErr) throw upErr;
      if (updated?.length) return JSON.stringify({ status: "appended", slug, chars: content.length });
    }
    throw new Error(`'${slug}' is being edited by someone else right now. Try again.`);
  }

  if (name === "kb_delete") {
    await supabase.from("knowledge_docs").update({ updated_by: author }).eq("slug", slug);
    const { data, error } = await supabase.from("knowledge_docs").delete().eq("slug", slug).select("slug");
    if (error) throw error;
    return JSON.stringify(data?.length ? { status: "deleted", slug, note: "The last version is kept in the history." } : { error: `No document '${slug}'.` });
  }

  throw new Error(`Unknown knowledge tool: ${name}`);
}
