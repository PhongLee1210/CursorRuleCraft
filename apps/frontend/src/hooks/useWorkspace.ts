/**
 * Workspace React Query Hooks
 *
 * Custom hooks for fetching and managing workspace data with React Query
 */

import { useWorkspaceService } from '@frontend/hooks/useWorkspaceService';
import { useWorkspaceStore } from '@frontend/stores/workspace';
import type { UpdateWorkspaceOptions, Workspace, WorkspaceRole } from '@frontend/types/workspace';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Query keys for workspace-related queries
 */
export const workspaceQueryKeys = {
  all: ['workspaces'] as const,
  lists: () => [...workspaceQueryKeys.all, 'list'] as const,
  list: (filters?: string) => [...workspaceQueryKeys.lists(), filters] as const,
  owned: () => [...workspaceQueryKeys.all, 'owned'] as const,
  details: () => [...workspaceQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...workspaceQueryKeys.details(), id] as const,
  members: (id: string) => [...workspaceQueryKeys.detail(id), 'members'] as const,
  role: (id: string) => [...workspaceQueryKeys.detail(id), 'role'] as const,
};

/**
 * Hook to fetch all workspaces for the current user
 */
export function useWorkspaces() {
  const workspaceService = useWorkspaceService();
  const setWorkspaces = useWorkspaceStore((state) => state.setWorkspaces);

  return useQuery({
    queryKey: workspaceQueryKeys.lists(),
    queryFn: async () => {
      const result = await workspaceService.getUserWorkspaces();
      if (result.error) {
        throw result.error;
      }
      // Update the store with fetched workspaces
      if (result.data) {
        setWorkspaces(result.data);
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch owned workspaces
 */
export function useOwnedWorkspaces() {
  const workspaceService = useWorkspaceService();

  return useQuery({
    queryKey: workspaceQueryKeys.owned(),
    queryFn: async () => {
      const result = await workspaceService.getOwnedWorkspaces();
      if (result.error) {
        throw result.error;
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch a workspace by ID
 */
export function useWorkspace(workspaceId: string | undefined) {
  const workspaceService = useWorkspaceService();

  return useQuery({
    queryKey: workspaceQueryKeys.detail(workspaceId || ''),
    queryFn: async () => {
      if (!workspaceId) throw new Error('Workspace ID is required');
      const result = await workspaceService.getWorkspaceById(workspaceId);
      if (result.error) {
        throw result.error;
      }
      return result.data;
    },
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch workspace members
 */
export function useWorkspaceMembers(workspaceId: string | undefined) {
  const workspaceService = useWorkspaceService();

  return useQuery({
    queryKey: workspaceQueryKeys.members(workspaceId || ''),
    queryFn: async () => {
      if (!workspaceId) throw new Error('Workspace ID is required');
      const result = await workspaceService.getWorkspaceMembers(workspaceId);
      if (result.error) {
        throw result.error;
      }
      return result.data;
    },
    enabled: !!workspaceId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to fetch user's role in a workspace
 */
export function useWorkspaceRole(workspaceId: string | undefined) {
  const workspaceService = useWorkspaceService();

  return useQuery({
    queryKey: workspaceQueryKeys.role(workspaceId || ''),
    queryFn: async () => {
      if (!workspaceId) throw new Error('Workspace ID is required');
      const result = await workspaceService.getUserRoleInWorkspace(workspaceId);
      if (result.error) {
        throw result.error;
      }
      return result.data;
    },
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to update a workspace
 */
export function useUpdateWorkspace() {
  const workspaceService = useWorkspaceService();
  const queryClient = useQueryClient();
  const updateWorkspace = useWorkspaceStore((state) => state.updateWorkspace);

  return useMutation({
    mutationFn: async ({
      workspaceId,
      updates,
    }: {
      workspaceId: string;
      updates: UpdateWorkspaceOptions;
    }) => {
      const result = await workspaceService.updateWorkspace(workspaceId, updates);
      if (result.error) {
        throw result.error;
      }
      return result.data!;
    },
    onSuccess: (workspace: Workspace) => {
      // Update workspace in store
      updateWorkspace(workspace.id, workspace);
      // Invalidate workspace queries
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.detail(workspace.id) });
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.lists() });
    },
  });
}

/**
 * Hook to delete a workspace
 */
export function useDeleteWorkspace() {
  const workspaceService = useWorkspaceService();
  const queryClient = useQueryClient();
  const removeWorkspace = useWorkspaceStore((state) => state.removeWorkspace);

  return useMutation({
    mutationFn: async (workspaceId: string) => {
      const result = await workspaceService.deleteWorkspace(workspaceId);
      if (result.error) {
        throw result.error;
      }
      return workspaceId;
    },
    onSuccess: (workspaceId: string) => {
      // Remove workspace from store
      removeWorkspace(workspaceId);
      // Invalidate workspace queries
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.owned() });
      queryClient.removeQueries({ queryKey: workspaceQueryKeys.detail(workspaceId) });
    },
  });
}

/**
 * Hook to add a member to a workspace
 */
export function useAddWorkspaceMember() {
  const workspaceService = useWorkspaceService();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      userId,
      role,
    }: {
      workspaceId: string;
      userId: string;
      role?: WorkspaceRole;
    }) => {
      const result = await workspaceService.addWorkspaceMember(workspaceId, userId, role);
      if (result.error) {
        throw result.error;
      }
      return result.data!;
    },
    onSuccess: (_, variables) => {
      // Invalidate workspace members query
      queryClient.invalidateQueries({
        queryKey: workspaceQueryKeys.members(variables.workspaceId),
      });
    },
  });
}

/**
 * Hook to remove a member from a workspace
 */
export function useRemoveWorkspaceMember() {
  const workspaceService = useWorkspaceService();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workspaceId, memberId }: { workspaceId: string; memberId: string }) => {
      const result = await workspaceService.removeWorkspaceMember(workspaceId, memberId);
      if (result.error) {
        throw result.error;
      }
      return { workspaceId, memberId };
    },
    onSuccess: (data) => {
      // Invalidate workspace members query
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.members(data.workspaceId) });
    },
  });
}

/**
 * Hook to update a member's role
 */
export function useUpdateWorkspaceMemberRole() {
  const workspaceService = useWorkspaceService();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      memberId,
      role,
    }: {
      workspaceId: string;
      memberId: string;
      role: WorkspaceRole;
    }) => {
      const result = await workspaceService.updateWorkspaceMemberRole(workspaceId, memberId, role);
      if (result.error) {
        throw result.error;
      }
      return result.data!;
    },
    onSuccess: (_, variables) => {
      // Invalidate workspace members query
      queryClient.invalidateQueries({
        queryKey: workspaceQueryKeys.members(variables.workspaceId),
      });
    },
  });
}

/**
 * Hook to get the current workspace from the store
 */
export function useCurrentWorkspace() {
  return useWorkspaceStore((state) => state.currentWorkspace);
}

/**
 * Hook to get workspace actions from the store
 */
export function useWorkspaceActions() {
  return {
    setCurrentWorkspace: useWorkspaceStore((state) => state.setCurrentWorkspace),
    setWorkspaces: useWorkspaceStore((state) => state.setWorkspaces),
    addWorkspace: useWorkspaceStore((state) => state.addWorkspace),
    updateWorkspace: useWorkspaceStore((state) => state.updateWorkspace),
    removeWorkspace: useWorkspaceStore((state) => state.removeWorkspace),
    reset: useWorkspaceStore((state) => state.reset),
  };
}
