# Query to Retrieve All Projects from mycms.space

## SQL Query

```sql
-- Get all projects from page_blocks
SELECT 
  pb.id,
  pb.block_config->>'section_title' AS section_title,
  pb.block_config->>'section_subtitle' AS section_subtitle,
  pb.block_config->>'section_description' AS section_description,
  pb.block_config->>'show_section' AS show_section,
  pb.block_config->'projects' AS projects,
  pb.block_config->'categories' AS categories,
  pb.updated_at
FROM page_blocks pb
WHERE pb.block_type = 'project-showcase'
ORDER BY pb.updated_at DESC;
```

## Query to Get Individual Projects (Unrolled)

```sql
-- Get individual projects with their images and categories
SELECT 
  p.id,
  p.title,
  p.description,
  p.demo_link,
  p.problem_statement,
  p.why_built,
  p.order_index,
  p.enabled,
  p.images,
  p.categories
FROM (
  SELECT 
    pb.id,
    jsonb_array_elements(pb.block_config->'projects') AS project
) AS pb
CROSS JOIN LATERAL jsonb_to_record(pb.project) AS 
  p(
    id TEXT,
    title TEXT,
    description TEXT,
    demo_link TEXT,
    problem_statement TEXT,
    why_built TEXT,
    order_index INTEGER,
    enabled BOOLEAN,
    images JSONB,
    categories JSONB
  )
WHERE pb.block_type = 'project-showcase'
ORDER BY p.order_index;
```

## Query to Get Projects with Category Names

```sql
-- Get projects with category names (instead of slugs)
SELECT 
  p.id,
  p.title,
  p.description,
  p.demo_link,
  p.problem_statement,
  p.why_built,
  p.order_index,
  p.enabled,
  p.images,
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', c.id,
        'name', c.name,
        'slug', c.slug,
        'order_index', c.order_index
      )
    )
    FROM jsonb_array_elements_text(p.categories) AS cat_slug
    LEFT JOIN categories c ON c.slug = cat_slug
  ) AS category_details
FROM (
  SELECT 
    pb.id,
    jsonb_array_elements(pb.block_config->'projects') AS project
  FROM page_blocks pb
  WHERE pb.block_type = 'project-showcase'
) AS pb
CROSS JOIN LATERAL jsonb_to_record(pb.project) AS 
  p(
    id TEXT,
    title TEXT,
    description TEXT,
    demo_link TEXT,
    problem_statement TEXT,
    why_built TEXT,
    order_index INTEGER,
    enabled BOOLEAN,
    images JSONB,
    categories JSONB
  )
WHERE p.enabled = true
ORDER BY p.order_index;
```

## Query to Get Project Count

```sql
-- Count total projects
SELECT 
  jsonb_array_length(pb.block_config->'projects') AS project_count
FROM page_blocks pb
WHERE pb.block_type = 'project-showcase'
LIMIT 1;
```

## Query to Get Projects by Category

```sql
-- Get projects filtered by category
SELECT 
  p.id,
  p.title,
  p.description,
  p.demo_link,
  p.problem_statement,
  p.why_built,
  p.order_index,
  p.enabled,
  p.images,
  p.categories
FROM (
  SELECT 
    pb.id,
    jsonb_array_elements(pb.block_config->'projects') AS project
  FROM page_blocks pb
  WHERE pb.block_type = 'project-showcase'
) AS pb
CROSS JOIN LATERAL jsonb_to_record(pb.project) AS 
  p(
    id TEXT,
    title TEXT,
    description TEXT,
    demo_link TEXT,
    problem_statement TEXT,
    why_built TEXT,
    order_index INTEGER,
    enabled BOOLEAN,
    images JSONB,
    categories JSONB
  )
WHERE p.enabled = true
  AND 'ai-ml' = ANY(jsonb_array_elements_text(p.categories))  -- Filter by category
ORDER BY p.order_index;
```

## Query to Get Enabled Projects Only

```sql
-- Get only enabled projects
SELECT 
  p.id,
  p.title,
  p.description,
  p.demo_link,
  p.problem_statement,
  p.why_built,
  p.order_index,
  p.images,
  p.categories
FROM (
  SELECT 
    pb.id,
    jsonb_array_elements(pb.block_config->'projects') AS project
  FROM page_blocks pb
  WHERE pb.block_type = 'project-showcase'
) AS pb
CROSS JOIN LATERAL jsonb_to_record(pb.project) AS 
  p(
    id TEXT,
    title TEXT,
    description TEXT,
    demo_link TEXT,
    problem_statement TEXT,
    why_built TEXT,
    order_index INTEGER,
    enabled BOOLEAN,
    images JSONB,
    categories JSONB
  )
WHERE p.enabled = true
ORDER BY p.order_index;
```

## Query to Get Project Images

```sql
-- Get projects with their images
SELECT 
  p.id,
  p.title,
  p.images,
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', pi.id,
        'image_url', pi.image_url,
        'image_path', pi.image_path,
        'order_index', pi.order_index
      )
    )
    FROM jsonb_array_elements(p.images) AS image_item
    CROSS JOIN LATERAL jsonb_to_record(image_item) AS 
    pi(
      id TEXT,
      image_url TEXT,
      image_path TEXT,
      order_index INTEGER
    )
  ) AS image_details
FROM (
  SELECT 
    pb.id,
    jsonb_array_elements(pb.block_config->'projects') AS project
  FROM page_blocks pb
  WHERE pb.block_type = 'project-showcase'
) AS pb
CROSS JOIN LATERAL jsonb_to_record(pb.project) AS 
  p(
    id TEXT,
    title TEXT,
    description TEXT,
    demo_link TEXT,
    problem_statement TEXT,
    why_built TEXT,
    order_index INTEGER,
    enabled BOOLEAN,
    images JSONB,
    categories JSONB
  )
WHERE p.enabled = true
ORDER BY p.order_index;
```

## Usage in Supabase SQL Editor

1. Go to your Supabase project
2. Navigate to SQL Editor
3. Paste any of the queries above
4. Run the query
5. View results

## Integration with Frontend

The data structure matches what the frontend expects:

```typescript
interface Project {
  id: string;
  title: string;
  description: string;
  demo_link?: string;
  problem_statement?: string;
  why_built?: string;
  order_index: number;
  enabled: boolean;
  images: ProjectImage[];
  categories: string[];
}

interface ProjectImage {
  id: string;
  image_url: string;
  image_path: string;
  order_index: number;
}
```

## Notes

- All project data is stored in JSONB format in `page_blocks.block_config`
- Projects are embedded within the `block_config->'projects'` array
- Images and categories are also stored as arrays within each project
- Use `jsonb_array_elements()` to expand arrays for filtering
- Use `jsonb_to_record()` to convert JSON objects to structured data
- Always check `enabled = true` to filter out disabled projects

## Example Result Format

```json
{
  "id": "uuid-1",
  "title": "Private AI Chatspace",
  "description": "Self-hosted LLM chat with enterprise-grade RAG capabilities",
  "demo_link": "https://github.com/magnusfroste/private-ai-chatspace",
  "problem_statement": "Need private AI chat with data control",
  "why_built": "Inspired by AnythingLLM but simpler",
  "order_index": 1,
  "enabled": true,
  "images": [
    {
      "id": "img-1",
      "image_url": "/path/to/image1.png",
      "image_path": "/lovable-uploads/...",
      "order_index": 1
    }
  ],
  "categories": ["ai-ml", "business"]
}
```

---

**Last Updated**: February 2026  
**Database**: Supabase PostgreSQL  
**Table**: page_blocks  
**Block Type**: project-showcase
