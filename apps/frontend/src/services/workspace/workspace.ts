import type { ApiClient } from '@/lib/api-client';
import {
  mapToWorkspaceDetailDto,
  mapToWorkspaceDto,
  mapToWorkspaceMemberDto,
} from '@/services/workspace/mapper';
import type {
  CreateWorkspaceOptions,
  UpdateWorkspaceOptions,
  Workspace,
  WorkspaceDetail,
  WorkspaceMember,
  WorkspaceRole,
  WorkspaceServiceResult,
} from '@/types/workspace';

/**
 * Create a new workspace
 */
export async function createWorkspace(
  apiClient: ApiClient,
  options: CreateWorkspaceOptions
): Promise<WorkspaceServiceResult<Workspace>> {
  try {
    const response = await apiClient.post<{ data: any }>('/workspaces', {
      name: options.name,
    });

    if (response.error) {
      console.error('[WorkspaceService] Error creating workspace:', response.error);
      return {
        data: null,
        error: response.error,
      };
    }

    return {
      data: mapToWorkspaceDto(response.data!.data),
      error: null,
    };
  } catch (error) {
    console.error('[WorkspaceService] Unexpected error creating workspace:', error);
    return {
      data: null,
      error: error as any,
    };
  }
}

/**
 * Get all workspaces for the current user
 */
export async function getUserWorkspaces(
  apiClient: ApiClient
): Promise<WorkspaceServiceResult<Workspace[]>> {
  try {
    const response = await apiClient.get<{ data: any[] }>('/workspaces');

    if (response.error) {
      console.error('[WorkspaceService] Error fetching user workspaces:', response.error);
      return {
        data: null,
        error: response.error,
      };
    }

    const workspaces = response.data!.data.map(mapToWorkspaceDto);

    return {
      data: workspaces,
      error: null,
    };
  } catch (error) {
    console.error('[WorkspaceService] Unexpected error fetching user workspaces:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error occurred'),
    };
  }
}

/**
 * Get workspaces owned by the current user
 */
export async function getOwnedWorkspaces(
  apiClient: ApiClient
): Promise<WorkspaceServiceResult<Workspace[]>> {
  try {
    const response = await apiClient.get<{ data: any[] }>('/workspaces/owned');

    if (response.error) {
      console.error('[WorkspaceService] Error fetching owned workspaces:', response.error);
      return {
        data: null,
        error: response.error,
      };
    }

    const workspaces = response.data!.data.map(mapToWorkspaceDto);

    return {
      data: workspaces,
      error: null,
    };
  } catch (error) {
    console.error('[WorkspaceService] Unexpected error fetching owned workspaces:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error occurred'),
    };
  }
}

/**
 * Get a workspace by ID
 */
export async function getWorkspaceById(
  apiClient: ApiClient,
  workspaceId: string
): Promise<WorkspaceServiceResult<WorkspaceDetail>> {
  try {
    const response = await apiClient.get<{ data: any }>(`/workspaces/${workspaceId}`);

    if (response.error) {
      console.error('[WorkspaceService] Error fetching workspace:', response.error);
      return {
        data: null,
        error: response.error,
      };
    }

    return {
      data: mapToWorkspaceDetailDto(response.data!.data),
      error: null,
    };
  } catch (error) {
    console.error('[WorkspaceService] Unexpected error fetching workspace:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error occurred'),
    };
  }
}

/**
 * Update a workspace
 */
export async function updateWorkspace(
  apiClient: ApiClient,
  workspaceId: string,
  options: UpdateWorkspaceOptions
): Promise<WorkspaceServiceResult<Workspace>> {
  try {
    const response = await apiClient.put<{ data: any }>(`/workspaces/${workspaceId}`, options);

    if (response.error) {
      console.error('[WorkspaceService] Error updating workspace:', response.error);
      return {
        data: null,
        error: response.error,
      };
    }

    return {
      data: mapToWorkspaceDto(response.data!.data),
      error: null,
    };
  } catch (error) {
    console.error('[WorkspaceService] Unexpected error updating workspace:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error occurred'),
    };
  }
}

/**
 * Delete a workspace
 */
export async function deleteWorkspace(
  apiClient: ApiClient,
  workspaceId: string
): Promise<WorkspaceServiceResult<boolean>> {
  try {
    const response = await apiClient.delete<{ data: boolean }>(`/workspaces/${workspaceId}`);

    if (response.error) {
      console.error('[WorkspaceService] Error deleting workspace:', response.error);
      return {
        data: null,
        error: response.error,
      };
    }

    return {
      data: true,
      error: null,
    };
  } catch (error) {
    console.error('[WorkspaceService] Unexpected error deleting workspace:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error occurred'),
    };
  }
}

/**
 * Get workspace members
 */
export async function getWorkspaceMembers(
  apiClient: ApiClient,
  workspaceId: string
): Promise<WorkspaceServiceResult<WorkspaceMember[]>> {
  try {
    const response = await apiClient.get<{ data: any[] }>(`/workspaces/${workspaceId}/members`);

    if (response.error) {
      console.error('[WorkspaceService] Error fetching workspace members:', response.error);
      return {
        data: null,
        error: response.error,
      };
    }

    const members = response.data!.data.map(mapToWorkspaceMemberDto);

    return {
      data: members,
      error: null,
    };
  } catch (error) {
    console.error('[WorkspaceService] Unexpected error fetching workspace members:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error occurred'),
    };
  }
}

/**
 * Add a member to a workspace
 */
export async function addWorkspaceMember(
  apiClient: ApiClient,
  workspaceId: string,
  userId: string,
  role: WorkspaceRole = 'MEMBER'
): Promise<WorkspaceServiceResult<WorkspaceMember>> {
  try {
    const response = await apiClient.post<{ data: any }>(`/workspaces/${workspaceId}/members`, {
      userId,
      role,
    });

    if (response.error) {
      console.error('[WorkspaceService] Error adding workspace member:', response.error);
      return {
        data: null,
        error: response.error,
      };
    }

    return {
      data: mapToWorkspaceMemberDto(response.data!.data),
      error: null,
    };
  } catch (error) {
    console.error('[WorkspaceService] Unexpected error adding workspace member:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error occurred'),
    };
  }
}

/**
 * Remove a member from a workspace
 */
export async function removeWorkspaceMember(
  apiClient: ApiClient,
  workspaceId: string,
  memberId: string
): Promise<WorkspaceServiceResult<boolean>> {
  try {
    const response = await apiClient.delete<{ data: boolean }>(
      `/workspaces/${workspaceId}/members/${memberId}`
    );

    if (response.error) {
      console.error('[WorkspaceService] Error removing workspace member:', response.error);
      return {
        data: null,
        error: response.error,
      };
    }

    return {
      data: true,
      error: null,
    };
  } catch (error) {
    console.error('[WorkspaceService] Unexpected error removing workspace member:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error occurred'),
    };
  }
}

/**
 * Update a member's role in a workspace
 */
export async function updateWorkspaceMemberRole(
  apiClient: ApiClient,
  workspaceId: string,
  memberId: string,
  role: WorkspaceRole
): Promise<WorkspaceServiceResult<WorkspaceMember>> {
  try {
    const response = await apiClient.put<{ data: any }>(
      `/workspaces/${workspaceId}/members/${memberId}`,
      { role }
    );

    if (response.error) {
      console.error('[WorkspaceService] Error updating member role:', response.error);
      return {
        data: null,
        error: response.error,
      };
    }

    return {
      data: mapToWorkspaceMemberDto(response.data!.data),
      error: null,
    };
  } catch (error) {
    console.error('[WorkspaceService] Unexpected error updating member role:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error occurred'),
    };
  }
}

/**
 * Get current user's role in a workspace
 */
export async function getUserRoleInWorkspace(
  apiClient: ApiClient,
  workspaceId: string
): Promise<WorkspaceServiceResult<WorkspaceRole>> {
  try {
    const response = await apiClient.get<{ data: { role: WorkspaceRole } }>(
      `/workspaces/${workspaceId}/role`
    );

    if (response.error) {
      console.error('[WorkspaceService] Error fetching user role:', response.error);
      return {
        data: null,
        error: response.error,
      };
    }

    return {
      data: response.data!.data.role,
      error: null,
    };
  } catch (error) {
    console.error('[WorkspaceService] Unexpected error fetching user role:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error occurred'),
    };
  }
}
