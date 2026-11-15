#!/usr/bin/env node
// MCP smoke test: calls the read tools of a live mycms MCP server and checks
// the answers. Read-only — it never calls a tool that writes.
//
//   MCP_URL=https://<project>.supabase.co/functions/v1/mcp-server \
//   MCP_KEY=mcms_... node scripts/mcp-smoke.mjs
//
// A key with the 'read' scope is enough. With 'settings' too, the Autopilot
// skills (analyze_analytics, analyze_seo …) are checked as well.

const URL_ = process.env.MCP_URL || "https://jcsjqnjvnqqghiaawhcl.supabase.co/functions/v1/mcp-server";
const KEY = process.env.MCP_KEY;
if (!KEY) {
  console.error("MCP_KEY is not set.");
  process.exit(2);
}

let id = 0;
async function rpc(method, params) {
  const res = await fetch(URL_, {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method, params }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body || body.error) throw new Error(`${method}: HTTP ${res.status} ${JSON.stringify(body?.error ?? body).slice(0, 300)}`);
  return body.result;
}

async function call(name, args = {}) {
  const r = await rpc("tools/call", { name, arguments: args });
  const text = r?.content?.[0]?.text ?? "";
  if (r?.isError) throw new Error(`${name} returned an error: ${text.slice(0, 300)}`);
  try { return JSON.parse(text); } catch { return text; }
}

const failures = [];
const check = (ok, msg) => { if (!ok) failures.push(msg); };

// Read tools every operator key has, with checks on the answer.
const READ = {
  site_overview: [{}, (r) => {
    check(Array.isArray(r.failed_runs), "site_overview.failed_runs is a list");
    check(r.failed_runs?.length === r.last_7_days?.failed_autopilot_runs, "site_overview: failed_runs matches the counter");
    check(r.failed_runs?.every((f) => f.error && f.error !== "unknown"), "site_overview: every failed run has an error");
  }],
  get_profile: [{}, (r) => check(typeof r === "object" && Object.keys(r).length > 0, "get_profile returns a profile")],
  get_resume: [{ max_chars: 4000 }, (r) => {
    check(typeof r === "string" && r.length <= 4600, `get_resume pages its answer (${String(r).length} chars)`);
    check(/next_offset: \d+/.test(String(r)), "get_resume points to the next page");
  }],
  analytics_summary: [{ days: 7 }, (r) => {
    check(typeof r.page_views === "number", "analytics_summary.page_views is a number");
    check(![500, 1000].includes(r.page_views), `analytics_summary.page_views is not a row cap (${r.page_views})`);
    check(Array.isArray(r.not_found), "analytics_summary.not_found is a list");
  }],
  autopilot_status: [{}, (r) => check(Array.isArray(r.failed_runs), "autopilot_status.failed_runs is a list")],
  review_queue_list: [{}, (r) => check(typeof r.count === "number", "review_queue_list.count is a number")],
  modules_list: [{}, (r) => check(Array.isArray(r) && r.length > 0, "modules_list lists modules")],
  nav_list: [{}, null],
  pages_list: [{}, null],
  blog_list: [{}, null],
  kb_list: [{}, null],
  list_projects: [{ limit: 3 }, null],
  newsletter_overview: [{}, null],
  settings_get: [{ module_type: "seo" }, (r) => check(!!r.module_config?.site_title, "settings_get(seo) has a site title")],
};

// Autopilot skills (need the 'settings' scope); checked when listed.
const SKILLS = {
  analyze_analytics: [{ period: "last_30_days" }, (r) => {
    check(r.period === "last_30_days", `analyze_analytics understood last_30_days (got ${r.period})`);
    check(![500, 1000].includes(r.total_views), `analyze_analytics.total_views is not a row cap (${r.total_views})`);
  }],
  analyze_seo: [{ page_slug: "home" }, (r) => check(typeof r.score === "number" && !!r.source, "analyze_seo returns a score and its source")],
  list_pages: [{}, (r) => check(r.count > 0, "list_pages lists pages")],
  weekly_digest: [{}, (r) => check(typeof r.visitors === "number", "weekly_digest.visitors is a number")],
  summarize_inbox: [{ limit: 1 }, (r) => check(!!r.notice, "summarize_inbox marks visitor text as untrusted")],
};

const init = await rpc("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "mcp-smoke", version: "1" } });
check(!!init?.serverInfo?.name, "initialize returns serverInfo");

const { tools } = await rpc("tools/list", {});
const names = tools.map((t) => t.name);
check(new Set(names).size === names.length, `tool names are unique (${names.length} tools)`);
for (const t of tools) check(t.inputSchema?.type === "object", `${t.name} has an object input schema`);
for (const n of ["generate_portfolio", "check_availability", "get_visitor_insights"]) check(!names.includes(n), `${n} (visitor chat only) is not listed`);

const plan = { ...READ, ...Object.fromEntries(Object.entries(SKILLS).filter(([n]) => names.includes(n))) };
for (const [name, [args, verify]] of Object.entries(plan)) {
  if (!names.includes(name)) { failures.push(`${name} is missing from tools/list`); continue; }
  try {
    const r = await call(name, args);
    verify?.(r);
    console.log(`ok   ${name}`);
  } catch (e) {
    failures.push(e.message);
    console.log(`FAIL ${name}`);
  }
}
const skipped = Object.keys(SKILLS).filter((n) => !names.includes(n));
if (skipped.length) console.log(`skip ${skipped.join(", ")} (key has no 'settings' scope)`);

if (failures.length) {
  console.error(`\n${failures.length} problem(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log(`\nMCP smoke test passed: ${Object.keys(plan).length} tools checked, ${tools.length} listed.`);
