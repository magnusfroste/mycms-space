-- Drop legacy tables that have been migrated to ai_module and block_config

-- Drop chat_settings (migrated to ai_module for webhook, block_config for placeholders)
DROP TABLE IF EXISTS public.chat_settings;

-- Drop quick_actions (migrated to block_config.quick_actions)
DROP TABLE IF EXISTS public.quick_actions;