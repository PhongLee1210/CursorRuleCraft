import type { ApiClient } from '@/lib/api-client';
import {
  addWorkspaceMember,
  createWorkspace,
  deleteWorkspace,
  getOwnedWorkspaces,
  getUserRoleInWorkspace,
  getUserWorkspaces,
  getWorkspaceById,
  getWorkspaceMembers,
  removeWorkspaceMember,
  updateWorkspace,
  updateWorkspaceMemberRole,
} from '@/services/workspace/workspace';

export function createWorkspaceService(apiClient: ApiClient) {
  return {
    createWorkspace: createWorkspace.bind(null, apiClient),
    getUserWorkspaces: getUserWorkspaces.bind(null, apiClient),
    getOwnedWorkspaces: getOwnedWorkspaces.bind(null, apiClient),
    getWorkspaceById: getWorkspaceById.bind(null, apiClient),
    updateWorkspace: updateWorkspace.bind(null, apiClient),
    deleteWorkspace: deleteWorkspace.bind(null, apiClient),
    getWorkspaceMembers: getWorkspaceMembers.bind(null, apiClient),
    addWorkspaceMember: addWorkspaceMember.bind(null, apiClient),
    removeWorkspaceMember: removeWorkspaceMember.bind(null, apiClient),
    updateWorkspaceMemberRole: updateWorkspaceMemberRole.bind(null, apiClient),
    getUserRoleInWorkspace: getUserRoleInWorkspace.bind(null, apiClient),
  };
}

export type WorkspaceService = ReturnType<typeof createWorkspaceService>;

// Re-export types and utilities
export * from '@/types/workspace';
export { mapToWorkspaceDetailDto, mapToWorkspaceDto, mapToWorkspaceMemberDto } from './mapper';
