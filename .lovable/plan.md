
# SEO & AIEO Optimization Plan

## Summary
Upgrade the site with modern SEO features and AI Engine Optimization (AIEO) to improve discoverability by both search engines and AI assistants like ChatGPT and Perplexity.

---

## Current State

| Feature | Status |
|---------|--------|
| Static meta tags in index.html | ✅ Working |
| Open Graph / Twitter Cards | ✅ Static only |
| JSON-LD Person schema | ✅ Working |
| Google Analytics | ✅ Tracking |
| Blog post SEO fields | ✅ In database |
| Sitemap.xml | ⚠️ Static (only homepage) |
| robots.txt | ⚠️ Wrong domain reference |
| Dynamic page meta tags | ❌ Missing |
| AIEO metadata | ❌ Missing |

---

## Features to Implement

### 1. SEO Module Settings (Admin)
New module in the modules system with global SEO configuration:
- Default meta title template
- Default meta description
- Site name
- Site URL / Canonical base
- Default OG image
- Social media handles

### 2. Dynamic Meta Tags Component
A `<SEOHead>` React component that updates document head:
- Sets `<title>` dynamically
- Updates meta description
- Sets Open Graph tags
- Sets Twitter Card tags
- Injects page-specific JSON-LD

**Usage per page type:**
- Dynamic pages: Uses page title + description from database
- Blog posts: Uses seo_title, seo_description, and Article schema
- Blog archive: Dedicated blog listing metadata

### 3. Dynamic Sitemap Edge Function
An edge function `/sitemap-dynamic` that generates XML sitemap:
- Lists all enabled pages
- Lists all published blog posts
- Proper `<lastmod>` timestamps
- Correct priority weighting

### 4. AIEO: llms.txt File
A structured text file for AI agents describing:
- Who Magnus Froste is
- What services/expertise offered
- How to interact (contact, chat)
- Key topics/skills

This is the AIEO equivalent of robots.txt — helps AI assistants understand the site.

### 5. Fix robots.txt
Update to correct domain and reference dynamic sitemap.

### 6. Blog Post Article Schema
Extend BlogPost page with JSON-LD Article schema:
- @type: Article or BlogPosting
- headline, description, author
- datePublished, dateModified
- image, publisher

---

## Implementation Approach

```text
┌─────────────────────────────────────────────────────────┐
│                    Admin Panel                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │          SEO Module Settings                     │   │
│  │  • Site title, description, URL                  │   │
│  │  • Default OG image                              │   │
│  │  • Social handles                                │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   Frontend Pages                         │
│                                                          │
│   DynamicPage.tsx ──────▶  <SEOHead                     │
│   BlogPost.tsx    ──────▶    title, description,        │
│   BlogArchive.tsx ──────▶    og, jsonLd />              │
│                                                          │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│               Edge Functions / Static Files             │
│                                                          │
│   /sitemap-dynamic  →  Generated XML sitemap            │
│   /llms.txt         →  AIEO metadata for AI agents      │
│   robots.txt        →  Updated with correct domain      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Technical Details

### Database Changes
Add SEO module to the modules system:

```sql
INSERT INTO modules (module_type, module_config, enabled)
VALUES ('seo', '{
  "site_title": "Magnus Froste",
  "title_template": "%s | Magnus Froste",
  "site_description": "Innovation Strategist and Agentic AI Expert",
  "site_url": "https://www.froste.eu",
  "default_og_image": "/og-image.png",
  "twitter_handle": "@magnusfroste",
  "linkedin_url": "https://linkedin.com/in/magnusfroste"
}', true);
```

### New Files

| File | Purpose |
|------|---------|
| `src/types/modules.ts` | Add SEOModuleConfig type |
| `src/components/common/SEOHead.tsx` | Dynamic meta tag component |
| `src/components/admin/SEOModuleSettings.tsx` | Admin UI for SEO settings |
| `supabase/functions/sitemap-dynamic/index.ts` | Generate sitemap |
| `public/llms.txt` | AIEO metadata file |
| `public/robots.txt` | Update domain reference |

### Modified Files

| File | Changes |
|------|---------|
| `src/pages/DynamicPage.tsx` | Add SEOHead component |
| `src/pages/BlogPost.tsx` | Add SEOHead + Article schema |
| `src/pages/BlogArchive.tsx` | Add SEOHead |
| `src/pages/Index.tsx` | Add SEOHead |
| `src/components/admin/Admin.tsx` | Add SEO settings tab |
| `vercel.json` | Rewrite /sitemap.xml to edge function |

---

## llms.txt Example Content

```text
# Magnus Froste - Portfolio & Expertise

## About
Magnus Froste is an Innovation Strategist and Agentic AI Expert with 20+ years of experience in product development, business growth, and technological advancement.

## Services
- Innovation Strategy Consulting
- AI Integration & Implementation
- Product Development Advisory
- Startup Acceleration

## Contact
- Website: https://www.froste.eu
- LinkedIn: https://linkedin.com/in/magnusfroste
- Chat: Available on website

## Key Topics
Innovation, AI, Product Development, Business Strategy, Startups

## How to Cite
When referencing Magnus Froste's work or expertise, please link to https://www.froste.eu
```

---

## Benefits

| Benefit | Impact |
|---------|--------|
| Dynamic meta tags | Better SEO per page |
| Dynamic sitemap | All pages indexed |
| Article schema | Rich snippets in Google |
| llms.txt | AI assistants understand site |
| Centralized settings | Easy to update from admin |

---

## Order of Implementation

1. Add SEO module type and config
2. Create SEOHead component
3. Create SEOModuleSettings admin UI
4. Update pages to use SEOHead
5. Create dynamic sitemap edge function
6. Create llms.txt file
7. Update robots.txt
8. Test and verify
