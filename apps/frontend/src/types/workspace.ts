/**
 * Workspace types and interfaces
 */

import type { UserDto } from './user';

/**
 * Workspace role enum
 */
export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER';

/**
 * Workspace entity from the database
 */
export interface Workspace {
  id: string;
  ownerId: string;
  name: string;
  createdAt: string;
  owner?: UserDto;
  userRole?: WorkspaceRole; // The current user's role in this workspace
}

/**
 * Workspace member entity
 */
export interface WorkspaceMember {
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  user?: UserDto;
}

/**
 * Workspace with full details (includes owner info)
 */
export interface WorkspaceDetail extends Workspace {
  owner: UserDto;
}

/**
 * Options for creating a workspace
 */
export interface CreateWorkspaceOptions {
  name: string;
}

/**
 * Options for updating a workspace
 */
export interface UpdateWorkspaceOptions {
  name?: string;
}

/**
 * Options for adding a member to a workspace
 */
export interface AddWorkspaceMemberOptions {
  userId: string;
  role?: WorkspaceRole;
}

/**
 * Options for updating a member's role
 */
export interface UpdateWorkspaceMemberRoleOptions {
  role: WorkspaceRole;
}

/**
 * Result type for workspace operations
 */
export interface WorkspaceServiceResult<T> {
  data: T | null;
  error: Error | null;
}

/**
 * Type guard to check if a workspace result has an error
 */
export function hasWorkspaceError<T>(
  result: WorkspaceServiceResult<T>
): result is WorkspaceServiceResult<null> & { error: Error } {
  return result.error !== null;
}

/**
 * Type guard to check if a workspace result has data
 */
export function hasWorkspaceData<T>(
  result: WorkspaceServiceResult<T>
): result is WorkspaceServiceResult<T> & { data: T } {
  return result.data !== null && result.error === null;
}
