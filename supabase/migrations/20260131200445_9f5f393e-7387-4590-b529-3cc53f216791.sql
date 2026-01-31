-- ============================================
-- Fas 1: Migrera befintlig data till page_blocks.block_config
-- Bevarar all data från Magnus Froste
-- ============================================

-- 1. Migrera hero_settings till hero-block config
UPDATE page_blocks
SET block_config = (
  SELECT jsonb_build_object(
    'name', hs.name,
    'tagline', hs.tagline,
    'features', jsonb_build_array(
      jsonb_build_object('text', hs.feature1, 'icon', hs.feature1_icon),
      jsonb_build_object('text', hs.feature2, 'icon', hs.feature2_icon),
      jsonb_build_object('text', hs.feature3, 'icon', hs.feature3_icon)
    ),
    'enable_animations', hs.enable_animations,
    'animation_style', hs.animation_style
  )
  FROM hero_settings hs
  LIMIT 1
)
WHERE block_type = 'hero' AND (block_config->>'name') IS NULL;

-- 2. Migrera about_me_settings till about-split block config
UPDATE page_blocks
SET block_config = (
  SELECT jsonb_build_object(
    'name', am.name,
    'intro_text', am.intro_text,
    'additional_text', am.additional_text,
    'image_url', am.image_url,
    'image_path', am.image_path,
    'skills', jsonb_build_array(
      jsonb_build_object('title', am.skill1_title, 'description', am.skill1_description, 'icon', am.skill1_icon),
      jsonb_build_object('title', am.skill2_title, 'description', am.skill2_description, 'icon', am.skill2_icon),
      jsonb_build_object('title', am.skill3_title, 'description', am.skill3_description, 'icon', am.skill3_icon)
    )
  )
  FROM about_me_settings am
  LIMIT 1
)
WHERE block_type = 'about-split' AND (block_config->>'name') IS NULL;

-- 3. Migrera expertise_areas till expertise-grid block config
UPDATE page_blocks
SET block_config = jsonb_set(
  COALESCE(block_config, '{}'::jsonb),
  '{items}',
  (
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', ea.id,
        'title', ea.title,
        'description', ea.description,
        'icon', ea.icon,
        'order_index', ea.order_index,
        'enabled', ea.enabled
      ) ORDER BY ea.order_index
    ), '[]'::jsonb)
    FROM expertise_areas ea
    WHERE ea.enabled = true
  )
)
WHERE block_type = 'expertise-grid' AND (block_config->'items') IS NULL;

-- 4. Migrera featured_in till featured-carousel block config
UPDATE page_blocks
SET block_config = jsonb_set(
  COALESCE(block_config, '{}'::jsonb),
  '{items}',
  (
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', fi.id,
        'title', fi.title,
        'description', fi.description,
        'image_url', fi.image_url,
        'image_path', fi.image_path,
        'order_index', fi.order_index,
        'enabled', fi.enabled
      ) ORDER BY fi.order_index
    ), '[]'::jsonb)
    FROM featured_in fi
    WHERE fi.enabled = true
  )
)
WHERE block_type = 'featured-carousel' AND (block_config->'items') IS NULL;

-- 5. Migrera projects, project_images, project_categories och portfolio_settings till project-showcase block config
UPDATE page_blocks
SET block_config = (
  SELECT jsonb_build_object(
    'section_title', COALESCE(ps.section_title, 'Portfolio'),
    'section_subtitle', COALESCE(ps.section_subtitle, ''),
    'section_description', COALESCE(ps.section_description, ''),
    'show_section', COALESCE(ps.show_section, true),
    'categories', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'name', c.name,
          'slug', c.slug,
          'order_index', c.order_index,
          'enabled', c.enabled
        ) ORDER BY c.order_index
      ), '[]'::jsonb)
      FROM categories c
      WHERE c.enabled = true
    ),
    'projects', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'title', p.title,
          'description', p.description,
          'demo_link', p.demo_link,
          'problem_statement', p.problem_statement,
          'why_built', p.why_built,
          'order_index', p.order_index,
          'enabled', p.enabled,
          'images', COALESCE(
            (SELECT jsonb_agg(
              jsonb_build_object(
                'id', pi.id,
                'image_url', pi.image_url,
                'image_path', pi.image_path,
                'order_index', pi.order_index
              ) ORDER BY pi.order_index
            ) FROM project_images pi WHERE pi.project_id = p.id),
            '[]'::jsonb
          ),
          'categories', COALESCE(
            (SELECT jsonb_agg(cat.slug)
             FROM project_categories pc
             JOIN categories cat ON cat.id = pc.category_id
             WHERE pc.project_id = p.id),
            '[]'::jsonb
          )
        ) ORDER BY p.order_index
      ), '[]'::jsonb)
      FROM projects p
      WHERE p.enabled = true
    )
  )
  FROM portfolio_settings ps
  LIMIT 1
)
WHERE block_type = 'project-showcase' AND (block_config->'projects') IS NULL;

-- 6. Migrera quick_actions och chat_settings till chat-widget block config
UPDATE page_blocks
SET block_config = jsonb_set(
  COALESCE(block_config, '{}'::jsonb),
  '{quick_actions}',
  (
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', qa.id,
        'label', qa.label,
        'message', qa.message,
        'icon', qa.icon,
        'order_index', qa.order_index,
        'enabled', qa.enabled
      ) ORDER BY qa.order_index
    ), '[]'::jsonb)
    FROM quick_actions qa
    WHERE qa.enabled = true
  )
)
WHERE block_type = 'chat-widget' AND (block_config->'quick_actions') IS NULL;

-- 7. Lägg till versionshistorik-trigger för page_blocks
DROP TRIGGER IF EXISTS log_page_blocks_changes ON page_blocks;

CREATE TRIGGER log_page_blocks_changes
BEFORE UPDATE OR DELETE ON page_blocks
FOR EACH ROW
EXECUTE FUNCTION log_settings_change();

-- 8. Lägg till realtime för page_blocks
ALTER PUBLICATION supabase_realtime ADD TABLE page_blocks;