// ============================================
// Legacy Hook: Re-exports from Model Layer
// For backward compatibility
// ============================================

export {
  useAboutMeSettings,
  useUpdateAboutMeSettings,
  DEFAULT_ABOUT_ME_SETTINGS,
} from '@/models/aboutMe';

export type { AboutMeSettings, UpdateAboutMeInput } from '@/models/aboutMe';
