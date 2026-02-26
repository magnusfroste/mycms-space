

# Blog OG Image for Social Media Sharing

## Problem
When sharing a blog post on social media (Facebook, LinkedIn, Twitter), the preview always shows the generic froste.eu OG image instead of the blog post's cover image. This happens because the site is a Single Page Application (SPA) -- social media crawlers don't execute JavaScript, so they only see the static meta tags in `index.html`.

The current `SEOHead` component correctly updates OG tags via JavaScript, but crawlers never run that code.

## Solution
Create a backend function that detects social media crawlers and serves HTML with the correct OG meta tags (blog title, description, and cover image) for blog post URLs.

### How it works

1. **New edge function: `og-blog`** -- When called with a blog slug, it:
   - Fetches the blog post from the database
   - Returns a minimal HTML page with the correct `og:title`, `og:description`, `og:image`, `twitter:image`, etc.
   - Includes a JavaScript redirect so real users get sent to the SPA

2. **Vercel rewrite rule** -- Add a rewrite so that `/blog/:slug` requests go through the edge function first (only for crawler user agents), or simpler: add an `og-image` rewrite pattern that crawlers will follow.

### Recommended approach (simplest, most reliable)
Since Vercel rewrites can't easily filter by user-agent, the cleanest pattern is:

- Create edge function `og-blog` that accepts a `slug` query parameter
- The function returns a full HTML document with correct OG tags + a JS redirect to the real page
- Add a Vercel rewrite: `/og/blog/:slug` -> edge function
- **But** this doesn't help because crawlers hit `/blog/:slug` directly

**Better approach**: Use the edge function as a catch-all for `/blog/*` paths via Vercel rewrite, and have it return the full `index.html` content but with OG meta tags injected server-side.

### Implementation plan

1. **Create `supabase/functions/og-blog/index.ts`**
   - Accept the blog slug from the URL path or query param
   - Fetch the blog post (title, excerpt, cover_image_url) from database
   - Read the base `index.html` template
   - Replace the static OG meta tags with post-specific values
   - Return the modified HTML (the SPA still boots normally for real users)

2. **Update `vercel.json`**
   - Add a rewrite rule *before* the SPA catch-all:
   ```
   { "source": "/blog/:slug", "destination": "https://jcsjqnjvnqqghiaawhcl.supabase.co/functions/v1/og-blog?slug=:slug" }
   ```

3. **Update `public/_redirects`** (for Netlify/Lovable hosting)
   - Add equivalent redirect rule for blog post paths

### Technical details

**Edge function (`og-blog`):**
- Fetches post by slug from `blog_posts` table
- Constructs HTML with proper OG tags:
  - `og:title` = post title
  - `og:description` = post excerpt
  - `og:image` = post cover_image_url (full URL)
  - `og:type` = article
  - `twitter:card` = summary_large_image
  - `twitter:image` = post cover_image_url
- Returns the full SPA `index.html` with meta tags replaced, so the app works normally for browsers
- Falls back to default OG tags if post not found

**Vercel rewrite (before the catch-all):**
```json
{ "source": "/blog/:slug", "destination": "https://[project].supabase.co/functions/v1/og-blog?slug=:slug" }
```

This ensures every request to `/blog/my-post` gets the correct OG meta tags server-side, whether from a crawler or a real browser (the SPA still boots and takes over).

