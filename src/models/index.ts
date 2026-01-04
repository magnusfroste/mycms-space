// ============================================
// Model Layer Index
// Re-export all models for clean imports
// ============================================

// Projects
export {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  useDeleteProjectImage,
  useReorderProjectImages,
  useReorderProjects,
  uploadProjectImage,
  deleteProjectImageFromStorage,
  projectKeys,
} from './projects';

export type { Project, ProjectImage, CreateProjectInput, UpdateProjectInput } from './projects';

// Hero
export {
  useHeroSettings,
  useUpdateHeroSettings,
  defaultHeroSettings,
  heroKeys,
} from './hero';

export type { HeroSettings } from './hero';

// About Me
export {
  useAboutMeSettings,
  useUpdateAboutMeSettings,
  DEFAULT_ABOUT_ME_SETTINGS,
  aboutMeKeys,
} from './aboutMe';

export type { AboutMeSettings, UpdateAboutMeInput } from './aboutMe';

// Categories
export {
  useCategories,
  useProjectCategories,
  useUpdateProjectCategories,
  categoryKeys,
} from './categories';

export type { Category } from './categories';

// Expertise
export {
  useExpertiseAreas,
  useCreateExpertiseArea,
  useUpdateExpertiseArea,
  useDeleteExpertiseArea,
  useExpertiseAreasSubscription,
  expertiseKeys,
} from './expertise';

export type { ExpertiseArea } from './expertise';

// Featured
export {
  useFeaturedItems,
  useCreateFeaturedItem,
  useUpdateFeaturedItem,
  useDeleteFeaturedItem,
  useReorderFeaturedItem,
  featuredKeys,
} from './featured';

export type { FeaturedItem } from './featured';

// Quick Actions
export {
  useQuickActions,
  useAllQuickActions,
  useCreateQuickAction,
  useUpdateQuickAction,
  useDeleteQuickAction,
  quickActionKeys,
} from './quickActions';

export type { QuickAction } from './quickActions';

// Chat Settings
export {
  useChatSettings,
  useUpdateChatSettings,
  chatSettingsKeys,
} from './chatSettings';

export type { ChatSettings } from './chatSettings';

// Portfolio Settings
export {
  usePortfolioSettings,
  useUpdatePortfolioSettings,
  portfolioSettingsKeys,
} from './portfolioSettings';

export type { PortfolioSettings } from './portfolioSettings';

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
