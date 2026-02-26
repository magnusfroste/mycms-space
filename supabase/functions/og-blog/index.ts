import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://www.froste.eu";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;
const DEFAULT_TITLE = "Magnus Froste - Innovation Strategist & Agentic AI Expert";
const DEFAULT_DESCRIPTION =
  "Innovation Strategist and AI integration expert with 20+ years experience in product development, business growth, and technological advancement.";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");

  if (!slug) {
    return Response.redirect(`${SITE_URL}/blog`, 302);
  }

  // Fetch blog post from database
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  );

  const { data: post } = await supabase
    .from("blog_posts")
    .select("title, excerpt, cover_image_url, author_name, published_at, seo_title, seo_description")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  const title = post?.seo_title || post?.title || DEFAULT_TITLE;
  const description = post?.seo_description || post?.excerpt || DEFAULT_DESCRIPTION;
  const image = post?.cover_image_url || DEFAULT_OG_IMAGE;
  const fullImageUrl = image.startsWith("http") ? image : `${SITE_URL}${image}`;
  const canonicalUrl = `${SITE_URL}/blog/${slug}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${canonicalUrl}" />

  <!-- Open Graph -->
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(fullImageUrl)}" />
  <meta property="og:site_name" content="Magnus Froste" />
  ${post?.published_at ? `<meta property="article:published_time" content="${post.published_at}" />` : ""}
  ${post?.author_name ? `<meta property="article:author" content="${escapeHtml(post.author_name)}" />` : ""}

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(fullImageUrl)}" />

  <!-- Redirect browsers to SPA -->
  <script>window.location.replace("${canonicalUrl}");</script>
  <noscript><meta http-equiv="refresh" content="0;url=${canonicalUrl}" /></noscript>
</head>
<body>
  <p>Redirecting to <a href="${canonicalUrl}">${escapeHtml(title)}</a>...</p>
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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
