import { createClient } from "npm:@supabase/supabase-js@2";
import { loadSEOConfig, absoluteUrl, applyTitleTemplate } from "../_shared/seo-config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const seo = await loadSEOConfig(supabase);
  const SITE_URL = seo.site_url.replace(/\/$/, "");

  if (!slug) return Response.redirect(`${SITE_URL}/blog`, 302);

  const { data: post } = await supabase
    .from("blog_posts")
    .select("title, excerpt, cover_image_url, author_name, published_at, seo_title, seo_description")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  const pageTitle = post?.seo_title || post?.title;
  const title = applyTitleTemplate(pageTitle, seo);
  const description = post?.seo_description || post?.excerpt || seo.site_description;
  const image = post?.cover_image_url || seo.default_og_image;
  const fullImageUrl = absoluteUrl(image, SITE_URL);
  const canonicalUrl = `${SITE_URL}/blog/${slug}`;

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
  ${post?.published_at ? `<meta property="article:published_time" content="${post.published_at}" />` : ""}
  ${post?.author_name ? `<meta property="article:author" content="${esc(post.author_name)}" />` : ""}

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(description)}" />
  <meta name="twitter:image" content="${esc(fullImageUrl)}" />
  ${seo.twitter_handle ? `<meta name="twitter:site" content="${esc(seo.twitter_handle)}" />` : ""}

  <script>window.location.replace("${canonicalUrl}");</script>
  <noscript><meta http-equiv="refresh" content="0;url=${canonicalUrl}" /></noscript>
</head>
<body>
  <p>Redirecting to <a href="${canonicalUrl}">${esc(title)}</a>...</p>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      ...corsHeaders,
    },
  });
});

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
