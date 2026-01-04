// ============================================
// Legacy Hook: Re-exports from Model Layer
// For backward compatibility
// ============================================

export {
  useNavLinks,
  useAllNavLinks,
  useCreateNavLink,
  useUpdateNavLink,
  useDeleteNavLink,
  useReorderNavLinks,
} from '@/models/navLinks';

export type { NavLink, CreateNavLinkInput, UpdateNavLinkInput } from '@/models/navLinks';
