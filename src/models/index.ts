// ============================================
// Model Layer Index
// Re-export all models for clean imports
// ============================================

// Modules (unified module system - replaces ai_module, etc.)
export {
  useModule,
  useAllModules,
  useUpdateModule,
  useAIModule,
  useUpdateAIModule,
  useProjectsModule,
  useUpdateProjectsModule,
  modulesKeys,
} from './modules';

export type {
  Module,
  ModuleType,
  AIModuleConfig,
  ProjectsModuleConfig,
} from './modules';

// Nav Links
export {
  useNavLinks,
  useAllNavLinks,
  useCreateNavLink,
  useUpdateNavLink,
  useDeleteNavLink,
  useReorderNavLinks,
  navLinksKeys,
} from './navLinks';

export type { NavLink, CreateNavLinkInput, UpdateNavLinkInput } from './navLinks';

// Page Blocks
export {
  usePageBlocks,
  useAllPageBlocks,
  useCreatePageBlock,
  useUpdatePageBlock,
  useDeletePageBlock,
  useReorderPageBlocks,
  usePageBlocksSubscription,
  pageBlocksKeys,
} from './pageBlocks';

export type { PageBlock, CreatePageBlockInput, UpdatePageBlockInput } from './pageBlocks';

// Block Content (unified JSONB access)
export {
  useBlockContent,
  useBlockByType,
  useUpdateBlockConfig,
  useReplaceBlockConfig,
  useBlockContentSubscription,
  blockContentKeys,
  getTypedConfig,
} from './blockContent';

export type {
  BlockConfigType,
  ConfigForBlockType,
} from '@/types/blockConfigs';

// Analytics
export {
  useAnalyticsSummary,
  analyticsKeys,
  trackPageView,
  trackProjectView,
  trackChatSession,
  updateChatSession,
  getVisitorId,
} from './analytics';

export type { AnalyticsSummary } from './analytics';

// Contact Messages
export {
  useContactMessages,
  useMarkMessageAsRead,
  useDeleteContactMessage,
  useCreateContactMessage,
  useContactMessagesSubscription,
  contactMessagesKeys,
} from './contactMessages';

export type { ContactMessage, CreateContactMessageInput } from './contactMessages';

// Settings History
export {
  useSettingsHistory,
  settingsHistoryKeys,
} from './settingsHistory';

// Pages
export {
  usePages,
  useMainLandingPage,
  useCreatePage,
  useUpdatePage,
  useDeletePage,
  pagesKeys,
} from './pages';

export type { Page, CreatePageInput, UpdatePageInput } from './pages';
