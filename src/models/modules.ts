// ============================================
// Model Layer: Modules
// React Query hooks + business logic
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import * as modulesData from '@/data/modules';
import type {
  Module,
  ModuleType,
  ConfigForModule,
  AIModuleConfig,
  ProjectsModuleConfig,
  HeaderModuleConfig,
  FooterModuleConfig,
  GitHubModuleConfig,
} from '@/types/modules';
import { defaultModuleConfigs } from '@/types/modules';

// Re-export types
export type { Module, ModuleType, ConfigForModule, AIModuleConfig, ProjectsModuleConfig, HeaderModuleConfig, FooterModuleConfig, GitHubModuleConfig };

// Query keys
export const modulesKeys = {
  all: ['modules'] as const,
  byType: (type: ModuleType) => ['modules', type] as const,
};

// Fetch single module by type
export const useModule = <T extends ModuleType>(moduleType: T) => {
  return useQuery({
    queryKey: modulesKeys.byType(moduleType),
    queryFn: () => modulesData.fetchModule<ConfigForModule<T>>(moduleType),
  });
};

// Fetch all modules
export const useAllModules = () => {
  return useQuery({
    queryKey: modulesKeys.all,
    queryFn: modulesData.fetchAllModules,
  });
};

// Update module
export const useUpdateModule = <T extends ModuleType>(moduleType: T) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: Partial<{ enabled: boolean; module_config: ConfigForModule<T> }>) =>
      modulesData.updateModule<ConfigForModule<T>>(moduleType, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: modulesKeys.byType(moduleType) });
      queryClient.invalidateQueries({ queryKey: modulesKeys.all });
    },
  });
};

// Create module (for initial setup)
export const useCreateModule = <T extends ModuleType>(moduleType: T) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ config, enabled = true }: { config: ConfigForModule<T>; enabled?: boolean }) =>
      modulesData.createModule(moduleType, config, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: modulesKeys.all });
    },
  });
};

// ============================================
// Convenience hooks for specific modules
// ============================================

// AI Module
export const useAIModule = () => {
  const query = useModule('ai');
  return {
    ...query,
    config: query.data?.module_config as AIModuleConfig | undefined,
    isEnabled: query.data?.enabled ?? false,
  };
};

export const useUpdateAIModule = () => useUpdateModule('ai');

// Projects Module
export const useProjectsModule = () => {
  const query = useModule('projects');
  return {
    ...query,
    config: query.data?.module_config as ProjectsModuleConfig | undefined,
    isEnabled: query.data?.enabled ?? false,
  };
};

export const useUpdateProjectsModule = () => useUpdateModule('projects');

// Header Module
export const useHeaderModule = () => {
  const query = useModule('header');
  const defaultConfig = defaultModuleConfigs.header;
  
  return {
    ...query,
    config: (query.data?.module_config as HeaderModuleConfig) ?? defaultConfig,
    isEnabled: query.data?.enabled ?? true,
  };
};

export const useUpdateHeaderModule = () => useUpdateModule('header');

// Footer Module
export const useFooterModule = () => {
  const query = useModule('footer');
  const defaultConfig = defaultModuleConfigs.footer;
  
  return {
    ...query,
    config: (query.data?.module_config as FooterModuleConfig) ?? defaultConfig,
    isEnabled: query.data?.enabled ?? true,
  };
};

export const useUpdateFooterModule = () => useUpdateModule('footer');

// GitHub Module
export const useGitHubModule = () => {
  const query = useModule('github');
  const defaultConfig = defaultModuleConfigs.github;
  
  return {
    ...query,
    config: (query.data?.module_config as GitHubModuleConfig) ?? defaultConfig,
    isEnabled: query.data?.enabled ?? true,
  };
};

export const useUpdateGitHubModule = () => useUpdateModule('github');

// Realtime subscription hook
export const useModuleSubscription = (moduleType: ModuleType) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = modulesData.subscribeToModule(moduleType, () => {
      queryClient.invalidateQueries({ queryKey: modulesKeys.byType(moduleType) });
    });

    return unsubscribe;
  }, [moduleType, queryClient]);
};

// Type-safe config accessor
export const getModuleConfig = <T extends ModuleType>(
  module: Module | null | undefined,
  moduleType: T
): ConfigForModule<T> | null => {
  if (!module || module.module_type !== moduleType) return null;
  return module.module_config as ConfigForModule<T>;
};
