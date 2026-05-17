import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://www.froste.eu";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const repoName = url.searchParams.get("repoName");
  if (!repoName) return Response.redirect(`${SITE_URL}/`, 302);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: repo, error: repoError } = await supabase
    .from("github_repos")
    .select("name, enriched_title, enriched_description, description, problem_statement, why_it_matters, language, topics, cover_image_url")
    .eq("name", repoName)
    .eq("enabled", true)
    .maybeSingle();
  console.log("[og-project]", { repoName, found: !!repo, error: repoError?.message, title: repo?.enriched_title });

  const displayName = repo?.enriched_title || repo?.name || repoName;
  const title = `${displayName} — Magnus Froste`;
  const description =
    repo?.enriched_description ||
    repo?.problem_statement ||
    repo?.why_it_matters ||
    repo?.description ||
    `Case study and details for ${repoName}.`;
  const image = repo?.cover_image_url || DEFAULT_OG_IMAGE;
  const fullImageUrl = image.startsWith("http") ? image : `${SITE_URL}${image}`;
  const canonicalUrl = `${SITE_URL}/project/${repoName}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: repo?.name || repoName,
    description: repo?.description || description,
    programmingLanguage: repo?.language || undefined,
    keywords: Array.isArray(repo?.topics) ? repo!.topics.join(", ") : undefined,
    url: canonicalUrl,
    author: { "@type": "Person", name: "Magnus Froste", url: SITE_URL },
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
  <meta property="og:site_name" content="Magnus Froste" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(description)}" />
  <meta name="twitter:image" content="${esc(fullImageUrl)}" />

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
