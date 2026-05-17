// ============================================
// Dynamic Sitemap Edge Function
// Generates XML sitemap with all pages, blog posts and GitHub projects
// Reads base URL from the SEO module configuration.
// ============================================

import { createClient } from "npm:@supabase/supabase-js@2";
import { loadSEOConfig } from "../_shared/seo-config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/xml",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const seo = await loadSEOConfig(supabase);
    const siteUrl = seo.site_url.replace(/\/$/, "");
    const today = new Date().toISOString().split("T")[0];

    const [pagesRes, postsRes, reposRes] = await Promise.all([
      supabase.from("pages").select("slug, updated_at, is_main_landing").eq("enabled", true).order("slug"),
      supabase.from("blog_posts").select("slug, updated_at, published_at").eq("status", "published").order("published_at", { ascending: false }),
      supabase.from("github_repos").select("name, updated_at, pushed_at").eq("enabled", true).order("order_index"),
    ]);

    const pages = pagesRes.data || [];
    const posts = postsRes.data || [];
    const repos = reposRes.data || [];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Homepage
    const mainLanding = pages.find((p: { is_main_landing: boolean }) => p.is_main_landing);
    xml += entry(`${siteUrl}/`, mainLanding?.updated_at, today, "weekly", "1.0");

    for (const p of pages) {
      if (p.is_main_landing) continue;
      xml += entry(`${siteUrl}/${p.slug}`, p.updated_at, today, "monthly", "0.8");
    }

    // Blog archive + posts
    const latestPost = posts[0];
    xml += entry(`${siteUrl}/blog`, latestPost?.published_at || latestPost?.updated_at, today, "weekly", "0.8");
    for (const post of posts) {
      xml += entry(`${siteUrl}/blog/${post.slug}`, post.updated_at || post.published_at, today, "monthly", "0.6");
    }

    // GitHub projects
    for (const repo of repos) {
      xml += entry(`${siteUrl}/project/${repo.name}`, repo.updated_at || repo.pushed_at, today, "monthly", "0.7");
    }

    xml += `</urlset>`;

    console.log(`Sitemap: ${pages.length} pages, ${posts.length} posts, ${repos.length} projects`);

    return new Response(xml, { headers: corsHeaders, status: 200 });
  } catch (error) {
    console.error("Sitemap generation error:", error);
    const fallback = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://www.froste.eu/</loc></url>\n</urlset>`;
    return new Response(fallback, { headers: corsHeaders, status: 200 });
  }
});

function entry(loc: string, lastmodIso: string | null | undefined, today: string, changefreq: string, priority: string): string {
  const lastmod = lastmodIso ? String(lastmodIso).split("T")[0] : today;
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>\n`;
}
