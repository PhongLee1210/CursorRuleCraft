import type { ApiClient } from '@/lib/api-client';
import {
  disconnectGitHub,
  getGitHubStatus,
  initiateGitHubAuth,
} from '@/services/repository/github';
import {
  addRepository,
  connectGitHubRepository,
  deleteRepository,
  getAvailableGitHubRepositories,
  getRepositoryById,
  getRepositoryFileContent,
  getRepositoryFileTree,
  getWorkspaceRepositories,
  syncRepository,
  updateRepository,
} from '@/services/repository/repository';

export function createRepositoryService(apiClient: ApiClient) {
  return {
    getWorkspaceRepositories: getWorkspaceRepositories.bind(null, apiClient),
    getRepositoryById: getRepositoryById.bind(null, apiClient),
    addRepository: addRepository.bind(null, apiClient),
    updateRepository: updateRepository.bind(null, apiClient),
    deleteRepository: deleteRepository.bind(null, apiClient),
    syncRepository: syncRepository.bind(null, apiClient),
    getAvailableGitHubRepositories: getAvailableGitHubRepositories.bind(null, apiClient),
    connectGitHubRepository: connectGitHubRepository.bind(null, apiClient),
    getGitHubStatus: getGitHubStatus.bind(null, apiClient),
    initiateGitHubAuth: initiateGitHubAuth.bind(null, apiClient),
    disconnectGitHub: disconnectGitHub.bind(null, apiClient),
    getRepositoryFileTree: getRepositoryFileTree.bind(null, apiClient),
    getRepositoryFileContent: getRepositoryFileContent.bind(null, apiClient),
  };
}

export type RepositoryService = ReturnType<typeof createRepositoryService>;

// Re-export types
export * from '@/services/repository/github';
export * from '@/types/repository';
export { mapToRepositoryDto } from './mapper';
