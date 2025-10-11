import type { Workspace, WorkspaceDetail, WorkspaceMember } from '@/types/workspace';

/**
 * Maps raw workspace data from API to Workspace type
 */
export function mapToWorkspaceDto(data: any): Workspace {
  return {
    id: data.id,
    ownerId: data.owner_id,
    name: data.name,
    createdAt: data.created_at,
    userRole: data.userRole || data.user_role,
  };
}

/**
 * Maps raw workspace data to WorkspaceDetail type
 * Note: Same as Workspace since we don't store user objects
 */
export function mapToWorkspaceDetailDto(data: any): WorkspaceDetail {
  return {
    id: data.id,
    ownerId: data.owner_id,
    name: data.name,
    createdAt: data.created_at,
    userRole: data.userRole || data.user_role,
  };
}

/**
 * Maps raw workspace member data to WorkspaceMember type
 */
export function mapToWorkspaceMemberDto(data: any): WorkspaceMember {
  return {
    workspaceId: data.workspace_id,
    userId: data.user_id,
    role: data.role,
  };
}
