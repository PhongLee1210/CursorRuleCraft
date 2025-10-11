import type { ApiClient } from '@/lib/api-client';
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
    const response = await apiClient.get<{ data: any[] }>('/api/repositories', {
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
  } catch (error) {
    console.error('[RepositoryService] Unexpected error fetching repositories:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error occurred'),
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
    const response = await apiClient.get<{ data: any }>(`/api/repositories/${repositoryId}`);

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
  } catch (error) {
    console.error('[RepositoryService] Unexpected error fetching repository:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error occurred'),
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
    const response = await apiClient.post<{ data: any }>('/api/repositories', payload);

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
  } catch (error) {
    console.error('[RepositoryService] Unexpected error adding repository:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error occurred'),
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
    const response = await apiClient.put<{ data: any }>(
      `/api/repositories/${repositoryId}`,
      payload
    );

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
  } catch (error) {
    console.error('[RepositoryService] Unexpected error updating repository:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error occurred'),
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
    const response = await apiClient.delete<{ success: boolean }>(
      `/api/repositories/${repositoryId}`
    );

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
  } catch (error) {
    console.error('[RepositoryService] Unexpected error deleting repository:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error occurred'),
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
    const response = await apiClient.post<{ data: any }>(`/api/repositories/${repositoryId}/sync`);

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
  } catch (error) {
    console.error('[RepositoryService] Unexpected error syncing repository:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error occurred'),
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
): Promise<RepositoryServiceResult<any[]>> {
  try {
    const response = await apiClient.get<{ data: any[] }>('/api/repositories/github/available', {
      params: { page, perPage },
    });

    if (response.error) {
      console.error('[RepositoryService] Error fetching GitHub repositories:', response.error);
      return {
        data: null,
        error: response.error,
      };
    }

    return {
      data: response.data!.data,
      error: null,
    };
  } catch (error) {
    console.error('[RepositoryService] Unexpected error fetching GitHub repositories:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error occurred'),
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
    const response = await apiClient.post<{ data: any }>('/api/repositories/github/connect', {
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
  } catch (error) {
    console.error('[RepositoryService] Unexpected error connecting GitHub repository:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error occurred'),
    };
  }
}
