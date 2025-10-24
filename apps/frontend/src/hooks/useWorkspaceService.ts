import { useApiClient } from '@frontend/lib/api-client';
import { createWorkspaceService } from '@frontend/services/workspace';
import { useMemo } from 'react';

/**
 * Hook that provides a WorkspaceService instance
 * Automatically uses the authenticated API client to communicate with the backend
 *
 * Note: Workspaces are created automatically via Clerk webhooks when users sign up.
 * This service provides methods to fetch and manage existing workspaces.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const workspaceService = useWorkspaceService();
 *
 *   const handleGetWorkspaces = async () => {
 *     const { data, error } = await workspaceService.getUserWorkspaces();
 *
 *     if (error) {
 *       console.error('Failed to fetch workspaces:', error);
 *       return;
 *     }
 *
 *     console.log('Workspaces loaded:', data);
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
