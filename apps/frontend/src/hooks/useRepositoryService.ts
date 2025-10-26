import { useMemo } from 'react';

import { useApiClient } from '@frontend/lib/api-client';
import { createRepositoryService } from '@frontend/services/repository';

/**
 * Hook that provides a RepositoryService instance
 * Automatically uses the authenticated API client to communicate with the backend
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const repositoryService = useRepositoryService();
 *
 *   const handleConnectRepo = async () => {
 *     const { data, error } = await repositoryService.connectGitHubRepository(
 *       workspaceId,
 *       'owner',
 *       'repo'
 *     );
 *
 *     if (error) {
 *       console.error('Failed to connect repository:', error);
 *       return;
 *     }
 *
 *     console.log('Repository connected:', data);
 *   };
 * }
 * ```
 */
export function useRepositoryService() {
  const apiClient = useApiClient();

  const repositoryService = useMemo(() => {
    return createRepositoryService(apiClient);
  }, [apiClient]);

  return repositoryService;
}
