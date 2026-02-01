-- Drop legacy tables that are no longer used (data migrated to page_blocks.block_config)

-- Drop junction table first (foreign key dependencies)
DROP TABLE IF EXISTS project_categories;

-- Drop tables with foreign keys
DROP TABLE IF EXISTS project_images;
DROP TABLE IF EXISTS project_views;

-- Drop main legacy tables
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS hero_settings;
DROP TABLE IF EXISTS about_me_settings;
DROP TABLE IF EXISTS expertise_areas;
DROP TABLE IF EXISTS featured_in;
DROP TABLE IF EXISTS portfolio_settings;