import type { ApiError } from '@frontend/lib/api-client';

/**
 * Workspace types and interfaces
 */

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
  userRole?: WorkspaceRole; // The current user's role in this workspace
}

/**
 * Workspace member entity
 */
export interface WorkspaceMember {
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
}

/**
 * Workspace with full details
 * Note: owner is just the ownerId (Clerk user ID)
 * Fetch user details from Clerk using ownerId if needed
 */
export interface WorkspaceDetail extends Workspace {
  // No additional fields - just use ownerId from Workspace
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
  error: ApiError | null;
}

/**
 * Type guard to check if a workspace result has an error
 */
export function hasWorkspaceError<T>(
  result: WorkspaceServiceResult<T>
): result is WorkspaceServiceResult<null> & { error: ApiError } {
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
