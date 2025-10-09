import { useApiClient } from '@/lib/api-client';
import { createWorkspaceService } from '@/services/workspace';
import { useMemo } from 'react';

/**
 * Hook that provides a WorkspaceService instance
 * Automatically uses the authenticated API client to communicate with the backend
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const workspaceService = useWorkspaceService();
 *
 *   const handleCreateWorkspace = async () => {
 *     const { data, error } = await workspaceService.createWorkspace({
 *       name: 'My Workspace',
 *     });
 *
 *     if (error) {
 *       console.error('Failed to create workspace:', error);
 *       return;
 *     }
 *
 *     console.log('Workspace created:', data);
 *   };
 * }
 * ```
 */
export function useWorkspaceService() {
  const apiClient = useApiClient();

  const workspaceService = useMemo(() => {
    return createWorkspaceService(apiClient);
  }, [apiClient]);

  return workspaceService;
}
