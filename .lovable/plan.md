
# Blog Module & Block Implementation Plan

## Executive Summary
This plan introduces a world-class blog experience that follows the existing DMV architecture (Data-Model-View) and JSONB block storage pattern. We start with a traditional, fully-featured blog module and prepare it for future AI Content Creator integration.

## Architecture Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                    BLOG MODULE                               │
│                  (Global Settings)                           │
│  • Layout preferences • SEO defaults • Reading time toggle  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   BLOG POSTS TABLE                           │
│     (Separate table - not JSONB in page_blocks)             │
│  • Full content • SEO • Categories • Author • Status        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  BLOG BLOCK (Page Block)                     │
│   • Display settings • Post selection • Layout options      │
└─────────────────────────────────────────────────────────────┘
```

## Why Separate Table for Posts (Not JSONB)

Unlike projects (which are tied to a specific block), blog posts have characteristics that require a separate table:
1. **Volume**: Blogs can have hundreds of posts vs. a handful of projects
2. **Querying**: Need efficient filtering, pagination, and search
3. **Relationships**: Posts need categories, tags, authors
4. **SEO**: Each post is a separate indexable page with unique metadata
5. **Scheduling**: Future publishing requires database-level date comparisons
6. **AI Integration**: Easier for AI to query and analyze content patterns

---

## Database Schema

### 1. blog_posts Table
```sql
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,                    -- Markdown content
  cover_image_url TEXT,
  cover_image_path TEXT,
  author_name TEXT DEFAULT 'Admin',
  author_avatar_url TEXT,
  reading_time_minutes INTEGER,
  status TEXT DEFAULT 'draft',              -- draft | published | scheduled
  published_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ,
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT[],
  featured BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 2. blog_categories Table
```sql
CREATE TABLE blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3. blog_post_categories Junction
```sql
CREATE TABLE blog_post_categories (
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES blog_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, category_id)
);
```

### 4. Blog Module in modules Table
```json
{
  "module_type": "blog",
  "module_config": {
    "posts_per_page": 10,
    "show_reading_time": true,
    "show_author": true,
    "show_categories": true,
    "default_cover_image": "",
    "enable_comments": false,
    "date_format": "MMMM d, yyyy"
  }
}
```

---

## File Structure

```text
src/
├── types/
│   ├── modules.ts         (+ BlogModuleConfig)
│   └── blogConfigs.ts     (NEW - blog-specific types)
│
├── data/
│   └── blog.ts            (NEW - Supabase API calls)
│
├── models/
│   └── blog.ts            (NEW - React Query hooks)
│
├── components/
│   ├── blocks/
│   │   └── BlogBlock.tsx  (NEW - frontend display)
│   │
│   └── admin/
│       ├── BlogModuleSettings.tsx  (NEW)
│       └── block-editor/
│           ├── BlogBlockEditor.tsx     (NEW - block settings)
│           └── BlogPostEditor.tsx      (NEW - full post editor)
│
└── pages/
    └── BlogPost.tsx       (NEW - dynamic blog post page)
```

---

## Components Detail

### 1. BlogBlock (Frontend Display)
Displays blog posts on any page with configurable layout:

**Config Options:**
- `display_mode`: 'latest' | 'featured' | 'category' | 'selected'
- `layout`: 'grid' | 'list' | 'cards' | 'magazine'
- `posts_count`: number
- `show_excerpt`: boolean
- `category_filter`: string (slug)
- `selected_post_ids`: string[] (for manual selection)

**Features:**
- Responsive grid/list layouts
- Click to navigate to full post
- Category badges
- Reading time indicator
- Hover animations

### 2. BlogPostEditor (Admin - Rich Editor)
Full-featured post editor with:

**Content Tab:**
- Title input with live slug generation
- Markdown editor with preview toggle
- Cover image upload with drag-drop
- Excerpt input (auto-generated or manual)
- Reading time auto-calculation

**Settings Tab:**
- Category selection (multi-select)
- Author name and avatar
- Featured toggle
- Publication status dropdown
- Schedule publication date picker

**SEO Tab:**
- Meta title (with character count)
- Meta description (with character count)
- Keywords input
- Preview card (Google/Social)

### 3. BlogModuleSettings (Admin Sidebar)
Global blog configuration:
- Posts per page default
- Default author settings
- Show reading time toggle
- Show categories toggle
- Date format selection

---

## Frontend Pages

### Blog Post Page (/blog/:slug)
Dynamic page rendering individual posts:
- Full markdown rendering with syntax highlighting
- Table of contents generation
- Previous/Next post navigation
- Related posts section
- Share buttons
- Category links

### Blog Archive Page (/blog)
Optional standalone blog listing:
- All posts with pagination
- Category filter sidebar
- Search functionality
- Sort by date/popularity

---

## Admin Integration

### AdminSidebar Updates
Add new menu items:
```typescript
// Main Menu
{ id: 'blog', label: 'Blog', icon: PenSquare }

// Settings
{ id: 'blog-module', label: 'Blog Settings', icon: FileText }
```

### Block Library
Add new block type:
```typescript
{ type: 'blog', label: 'Blog Posts', icon: 'Layout', description: 'Display blog posts' }
```

---

## Phase 2: AI Content Creator (Future)

The architecture prepares for an AI Content Creator that can:

**Generate Content:**
- Draft blog posts from topic prompts
- Suggest headlines and SEO metadata
- Auto-generate excerpts
- Recommend categories and tags

**Multi-Channel Publishing:**
- Blog post
- Newsletter (integration with newsletter module)
- Social media snippets
- Email campaigns

**Content Intelligence:**
- Analyze existing posts for style
- Suggest improvements
- SEO optimization
- Readability scoring

---

## Implementation Order

### Step 1: Database Setup
- Create blog_posts table
- Create blog_categories table
- Create junction table
- Add blog module to modules table
- Create storage bucket for blog images
- Set up RLS policies

### Step 2: Types & Data Layer
- Add BlogModuleConfig to types/modules.ts
- Create types/blogConfigs.ts
- Create data/blog.ts with CRUD operations

### Step 3: Model Layer
- Create models/blog.ts with React Query hooks
- Export from models/index.ts

### Step 4: Admin Components
- BlogModuleSettings.tsx (global settings)
- BlogPostEditor.tsx (post editor)
- BlogBlockEditor.tsx (block config)
- Update AdminSidebar.tsx

### Step 5: Frontend Components
- BlogBlock.tsx (block display)
- BlogPost.tsx (individual post page)
- Add to BlockRenderer.tsx

### Step 6: Routing & Integration
- Add /blog/:slug route
- Optional: Add /blog archive page
- Update page-builder-chat with blog block support

---

## Key Features Summary

| Feature | Description |
|---------|-------------|
| Rich Editor | Markdown with preview, drag-drop images |
| Categories | Multi-category support with filtering |
| SEO Ready | Meta tags, slugs, social preview |
| Scheduling | Publish now or schedule for later |
| Reading Time | Auto-calculated from content |
| Responsive | Grid, list, magazine layouts |
| AI-Ready | Architecture prepared for AI content generation |
| Dynamic Pages | Each post gets its own URL |
| Featured Posts | Highlight important content |
| Draft System | Save drafts before publishing |

---

## Technical Notes

**Storage Bucket:**
- Name: `blog-images`
- Public: Yes
- Max size: 5MB (compressed on upload)

**RLS Policies:**
- Public can read published posts
- Authenticated can manage all posts

**Realtime:**
- Enable for blog_posts table
- Subscribe to changes in admin

This plan provides a solid foundation for a world-class blog experience while preparing the architecture for AI-powered content creation in the future.
