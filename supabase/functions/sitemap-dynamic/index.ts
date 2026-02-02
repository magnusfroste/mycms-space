// ============================================
// Dynamic Sitemap Edge Function
// Generates XML sitemap with all pages and blog posts
// ============================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/xml',
};

interface Page {
  slug: string;
  updated_at: string;
  is_main_landing: boolean;
}

interface BlogPost {
  slug: string;
  updated_at: string;
  published_at: string | null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Fetch enabled pages
    const { data: pages, error: pagesError } = await supabase
      .from('pages')
      .select('slug, updated_at, is_main_landing')
      .eq('enabled', true)
      .order('slug');

    if (pagesError) {
      console.error('Error fetching pages:', pagesError);
      throw pagesError;
    }

    // Fetch published blog posts
    const { data: posts, error: postsError } = await supabase
      .from('blog_posts')
      .select('slug, updated_at, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (postsError) {
      console.error('Error fetching blog posts:', postsError);
      throw postsError;
    }

    // Build sitemap XML
    const siteUrl = 'https://www.froste.eu';
    const today = new Date().toISOString().split('T')[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    // Add homepage (main landing page)
    const mainLanding = (pages as Page[])?.find(p => p.is_main_landing);
    xml += `  <url>
    <loc>${siteUrl}/</loc>
    <lastmod>${mainLanding?.updated_at?.split('T')[0] || today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
`;

    // Add other pages
    for (const page of (pages as Page[]) || []) {
      if (page.is_main_landing) continue; // Skip main landing (already added as /)
      
      const lastmod = page.updated_at?.split('T')[0] || today;
      xml += `  <url>
    <loc>${siteUrl}/${page.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    }

    // Add blog archive
    const latestPost = (posts as BlogPost[])?.[0];
    xml += `  <url>
    <loc>${siteUrl}/blog</loc>
    <lastmod>${latestPost?.published_at?.split('T')[0] || latestPost?.updated_at?.split('T')[0] || today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;

    // Add blog posts
    for (const post of (posts as BlogPost[]) || []) {
      const lastmod = post.updated_at?.split('T')[0] || post.published_at?.split('T')[0] || today;
      xml += `  <url>
    <loc>${siteUrl}/blog/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`;
    }

    xml += `</urlset>`;

    console.log(`Generated sitemap with ${pages?.length || 0} pages and ${posts?.length || 0} blog posts`);

    return new Response(xml, { 
      headers: corsHeaders,
      status: 200 
    });

  } catch (error) {
    console.error('Sitemap generation error:', error);
    
    // Return a basic sitemap on error
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.froste.eu/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <priority>1.0</priority>
  </url>
</urlset>`;

    return new Response(fallbackXml, { 
      headers: corsHeaders,
      status: 200 
    });
  }
});
