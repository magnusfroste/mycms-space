// ============================================
// Legacy Hook: Re-exports from Model Layer
// For backward compatibility
// ============================================

export {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  useDeleteProjectImage,
  useReorderProjectImages,
  useReorderProjects,
  uploadProjectImage as uploadImageToStorage,
  deleteProjectImageFromStorage as deleteImageFromStorage,
} from '@/models/projects';

export type {
  Project,
  ProjectImage,
  CreateProjectInput,
  UpdateProjectInput,
} from '@/models/projects';
