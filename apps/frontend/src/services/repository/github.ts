import type { ApiClient } from '@/lib/api-client';
import { normalizeServiceError } from '@/lib/utils';
import type { RepositoryServiceResult } from '@/types/repository';

/**
 * GitHub integration status
 */
export interface GitHubStatus {
  connected: boolean;
  username?: string;
  scopes?: string[];
  createdAt?: string;
}

/**
 * GitHub authorization URL response
 */
export interface GitHubAuthUrl {
  authUrl: string;
}

/**
 * Get GitHub integration status
 */
export async function getGitHubStatus(
  apiClient: ApiClient
): Promise<RepositoryServiceResult<GitHubStatus>> {
  try {
    const response = await apiClient.get<GitHubStatus>('/auth/github/status');

    if (response.error) {
      console.error('[GitHubService] Error fetching GitHub status:', response.error);
      return {
        data: null,
        error: response.error,
      };
    }

    return {
      data: response.data!,
      error: null,
    };
  } catch (caught: unknown) {
    const error = normalizeServiceError(caught);
    console.error('[GitHubService] Unexpected error fetching GitHub status:', error);
    return {
      data: null,
      error,
    };
  }
}

/**
 * Initiate GitHub OAuth flow - get authorization URL
 */
export async function initiateGitHubAuth(
  apiClient: ApiClient
): Promise<RepositoryServiceResult<GitHubAuthUrl>> {
  try {
    const response = await apiClient.get<GitHubAuthUrl>('/auth/github/authorize');

    if (response.error) {
      console.error('[GitHubService] Error initiating GitHub auth:', response.error);
      return {
        data: null,
        error: response.error,
      };
    }

    return {
      data: response.data!,
      error: null,
    };
  } catch (caught: unknown) {
    const error = normalizeServiceError(caught);
    console.error('[GitHubService] Unexpected error initiating GitHub auth:', error);
    return {
      data: null,
      error,
    };
  }
}

/**
 * Disconnect GitHub integration
 */
export async function disconnectGitHub(
  apiClient: ApiClient
): Promise<RepositoryServiceResult<boolean>> {
  try {
    const response = await apiClient.get<{ success: boolean }>('/auth/github/disconnect');

    if (response.error) {
      console.error('[GitHubService] Error disconnecting GitHub:', response.error);
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
    console.error('[GitHubService] Unexpected error disconnecting GitHub:', error);
    return {
      data: null,
      error,
    };
  }
}
