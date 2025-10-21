import { type ApiClient } from '@/lib/api-client';
import { normalizeServiceError } from '@/lib/utils';
import {
  mapToAddRepositoryPayload,
  mapToRepositoryDto,
  mapToUpdateRepositoryPayload,
} from '@/services/repository/mapper';
import type {
  AddRepositoryOptions,
  Repository,
  RepositoryServiceResult,
  UpdateRepositoryOptions,
} from '@/types/repository';

/**
 * Get all repositories for a workspace
 */
export async function getWorkspaceRepositories(
  apiClient: ApiClient,
  workspaceId: string
): Promise<RepositoryServiceResult<Repository[]>> {
  try {
    const response = await apiClient.get<{ data: any[] }>('/repositories', {
      params: { workspaceId },
    });

    if (response.error) {
      console.error('[RepositoryService] Error fetching repositories:', response.error);
      return {
        data: null,
        error: response.error,
      };
    }

    const repositories = response.data!.data.map(mapToRepositoryDto);

    return {
      data: repositories,
      error: null,
    };
  } catch (caught: unknown) {
    const error = normalizeServiceError(caught);
    console.error('[WorkspaceService] Unexpected error fetching user workspaces:', error);
    return {
      data: null,
      error,
    };
  }
}

/**
 * Get a single repository by ID
 */
export async function getRepositoryById(
  apiClient: ApiClient,
  repositoryId: string
): Promise<RepositoryServiceResult<Repository>> {
  try {
    const response = await apiClient.get<{ data: any }>(`/repositories/${repositoryId}`);

    if (response.error) {
      console.error('[RepositoryService] Error fetching repository:', response.error);
      return {
        data: null,
        error: response.error,
      };
    }

    return {
      data: mapToRepositoryDto(response.data!.data),
      error: null,
    };
  } catch (caught: unknown) {
    const error = normalizeServiceError(caught);
    console.error('[RepositoryService] Unexpected error fetching repository:', error);
    return {
      data: null,
      error,
    };
  }
}

/**
 * Add a repository to a workspace
 */
export async function addRepository(
  apiClient: ApiClient,
  options: AddRepositoryOptions
): Promise<RepositoryServiceResult<Repository>> {
  try {
    const payload = mapToAddRepositoryPayload(options);
    const response = await apiClient.post<{ data: any }>('/repositories', payload);

    if (response.error) {
      console.error('[RepositoryService] Error adding repository:', response.error);
      return {
        data: null,
        error: response.error,
      };
    }

    return {
      data: mapToRepositoryDto(response.data!.data),
      error: null,
    };
  } catch (caught: unknown) {
    const error = normalizeServiceError(caught);
    console.error('[RepositoryService] Unexpected error adding repository:', error);
    return {
      data: null,
      error,
    };
  }
}

/**
 * Update a repository
 */
export async function updateRepository(
  apiClient: ApiClient,
  repositoryId: string,
  options: UpdateRepositoryOptions
): Promise<RepositoryServiceResult<Repository>> {
  try {
    const payload = mapToUpdateRepositoryPayload(options);
    const response = await apiClient.put<{ data: any }>(`/repositories/${repositoryId}`, payload);

    if (response.error) {
      console.error('[RepositoryService] Error updating repository:', response.error);
      return {
        data: null,
        error: response.error,
      };
    }

    return {
      data: mapToRepositoryDto(response.data!.data),
      error: null,
    };
  } catch (caught) {
    const error = normalizeServiceError(caught);
    console.error('[RepositoryService] Unexpected error updating repository:', error);
    return {
      data: null,
      error,
    };
  }
}

/**
 * Delete a repository
 */
export async function deleteRepository(
  apiClient: ApiClient,
  repositoryId: string
): Promise<RepositoryServiceResult<boolean>> {
  try {
    const response = await apiClient.delete<{ success: boolean }>(`/repositories/${repositoryId}`);

    if (response.error) {
      console.error('[RepositoryService] Error deleting repository:', response.error);
      return {
        data: null,
        error: response.error,
      };
    }

    return {
      data: true,
      error: null,
    };
  } catch (caught: unknown) {
    const error = normalizeServiceError(caught);
    console.error('[RepositoryService] Unexpected error deleting repository:', error);
    return {
      data: null,
      error,
    };
  }
}

/**
 * Sync repository metadata from Git provider
 */
export async function syncRepository(
  apiClient: ApiClient,
  repositoryId: string
): Promise<RepositoryServiceResult<Repository>> {
  try {
    const response = await apiClient.post<{ data: any }>(`/repositories/${repositoryId}/sync`);

    if (response.error) {
      console.error('[RepositoryService] Error syncing repository:', response.error);
      return {
        data: null,
        error: response.error,
      };
    }

    return {
      data: mapToRepositoryDto(response.data!.data),
      error: null,
    };
  } catch (caught) {
    const error = normalizeServiceError(caught);
    console.error('[RepositoryService] Unexpected error syncing repository:', error);
    return {
      data: null,
      error,
    };
  }
}

/**
 * Get available GitHub repositories
 */
export async function getAvailableGitHubRepositories(
  apiClient: ApiClient,
  page = 1,
  perPage = 30
): Promise<
  RepositoryServiceResult<any[]> & {
    requiresSetup?: boolean;
    requiresReconnect?: boolean;
    message?: string;
  }
> {
  try {
    const response = await apiClient.get<{
      data: any[];
      message?: string;
      requiresSetup?: boolean;
      requiresReconnect?: boolean;
      error?: string;
    }>('/repositories/github/available', {
      params: { page, perPage },
    });

    if (response.error) {
      console.error('[RepositoryService] Error fetching GitHub repositories:', response.error);
      return {
        data: null,
        error: response.error,
      };
    }

    // Handle cases where GitHub is not connected or token expired
    if (response.data?.requiresSetup || response.data?.requiresReconnect) {
      return {
        data: response.data.data || [],
        error: null,
        requiresSetup: response.data.requiresSetup,
        requiresReconnect: response.data.requiresReconnect,
        message: response.data.message,
      };
    }

    return {
      data: response.data!.data,
      error: null,
    };
  } catch (caught) {
    const error = normalizeServiceError(caught);
    console.error('[RepositoryService] Unexpected error fetching GitHub repositories:', error);
    return {
      data: null,
      error,
    };
  }
}

/**
 * Connect a GitHub repository to a workspace
 */
export async function connectGitHubRepository(
  apiClient: ApiClient,
  workspaceId: string,
  owner: string,
  repo: string
): Promise<RepositoryServiceResult<Repository>> {
  try {
    const response = await apiClient.post<{ data: any }>('/repositories/github/connect', {
      workspaceId,
      owner,
      repo,
    });

    if (response.error) {
      console.error('[RepositoryService] Error connecting GitHub repository:', response.error);
      return {
        data: null,
        error: response.error,
      };
    }

    return {
      data: mapToRepositoryDto(response.data!.data),
      error: null,
    };
  } catch (caught: unknown) {
    const error = normalizeServiceError(caught);
    console.error('[RepositoryService] Unexpected error connecting GitHub repository:', error);
    return {
      data: null,
      error,
    };
  }
}

/**
 * Get repository file tree
 */

export interface IFileTreeNode {
  name: string;
  path: string;
  type: 'directory' | 'file';
  children?: IFileTreeNode[];
}

export async function getRepositoryFileTree(
  apiClient: ApiClient,
  repositoryId: string,
  branch?: string
): Promise<RepositoryServiceResult<IFileTreeNode[]>> {
  try {
    const response = await apiClient.get<IFileTreeNode[]>(`/repositories/${repositoryId}/tree`, {
      params: branch ? { branch } : undefined,
    });

    if (response.error) {
      console.error('[RepositoryService] Error fetching file tree:', response.error);
      return {
        data: null,
        error: response.error,
      };
    }

    return {
      data: response.data,
      error: null,
    };
  } catch (caught: unknown) {
    const error = normalizeServiceError(caught);
    console.error('[RepositoryService] Unexpected error fetching file tree:', error);
    return {
      data: null,
      error,
    };
  }
}

/**
 * Get file content from repository
 */
export async function getRepositoryFileContent(
  apiClient: ApiClient,
  repositoryId: string,
  path: string,
  branch?: string
): Promise<RepositoryServiceResult<{ content: string; path: string }>> {
  try {
    const params: any = { path };
    if (branch) {
      params.branch = branch;
    }

    const response = await apiClient.get<{ data: { content: string; path: string } }>(
      `/repositories/${repositoryId}/file`,
      { params }
    );

    if (response.error) {
      console.error('[RepositoryService] Error fetching file content:', response.error);
      return {
        data: null,
        error: response.error,
      };
    }

    return {
      data: response.data!.data,
      error: null,
    };
  } catch (caught: unknown) {
    const error = normalizeServiceError(caught);
    console.error('[RepositoryService] Unexpected error fetching file content:', error);
    return {
      data: null,
      error,
    };
  }
}
