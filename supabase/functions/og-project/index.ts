import { createClient } from "npm:@supabase/supabase-js@2";
import { loadSEOConfig, absoluteUrl, applyTitleTemplate } from "../_shared/seo-config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const seo = await loadSEOConfig(supabase);
  const SITE_URL = seo.site_url.replace(/\/$/, "");

  const url = new URL(req.url);
  const repoName = url.searchParams.get("repoName");
  if (!repoName) return Response.redirect(`${SITE_URL}/`, 302);

  const { data: repo } = await supabase
    .from("github_repos")
    .select("id, name, enriched_title, enriched_description, description, problem_statement, why_it_matters, language, topics")
    .eq("name", repoName)
    .eq("enabled", true)
    .maybeSingle();

  let coverImage: string | null = null;
  if (repo?.id) {
    const { data: img } = await supabase
      .from("github_repo_images")
      .select("image_url")
      .eq("repo_id", repo.id)
      .order("order_index")
      .limit(1)
      .maybeSingle();
    coverImage = img?.image_url || null;
  }

  const displayName = repo?.enriched_title || repo?.name || repoName;
  const title = applyTitleTemplate(displayName, seo);
  const description =
    repo?.enriched_description ||
    repo?.problem_statement ||
    repo?.why_it_matters ||
    repo?.description ||
    seo.site_description;
  const image = coverImage || seo.default_og_image;
  const fullImageUrl = absoluteUrl(image, SITE_URL);
  const canonicalUrl = `${SITE_URL}/project/${repoName}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: repo?.name || repoName,
    description: repo?.description || description,
    programmingLanguage: repo?.language || undefined,
    keywords: Array.isArray(repo?.topics) ? repo!.topics.join(", ") : undefined,
    url: canonicalUrl,
    author: { "@type": "Person", name: seo.site_title, url: SITE_URL },
  };

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  <link rel="canonical" href="${canonicalUrl}" />

  <meta property="og:type" content="article" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:image" content="${esc(fullImageUrl)}" />
  <meta property="og:site_name" content="${esc(seo.site_title)}" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(description)}" />
  <meta name="twitter:image" content="${esc(fullImageUrl)}" />
  ${seo.twitter_handle ? `<meta name="twitter:site" content="${esc(seo.twitter_handle)}" />` : ""}

  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>

  <script>window.location.replace("${canonicalUrl}");</script>
  <noscript><meta http-equiv="refresh" content="0;url=${canonicalUrl}" /></noscript>
</head>
<body><p>Redirecting to <a href="${canonicalUrl}">${esc(title)}</a>...</p></body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      ...corsHeaders,
    },
  });
});

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
