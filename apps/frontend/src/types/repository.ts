import { GitProvider, type GitProviderType } from '@cursorrulecraft/shared-types';

import type { ApiError } from '@frontend/lib/api-client';

/**
 * Repository types and interfaces for Git integrations
 */

// Re-export  GitProvider, for convenience
export { GitProvider };

/**
 * Repository entity
 */
export interface Repository {
  id: string;
  workspaceId: string;
  name: string;
  fullName: string; // e.g., "owner/repo"
  description?: string;
  url: string;
  provider: GitProviderType;
  defaultBranch: string;
  isPrivate: boolean;
  language?: string;
  topics?: string[];
  starsCount?: number;
  forksCount?: number;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Options for creating/adding a repository
 */
export interface AddRepositoryOptions {
  workspaceId: string;
  name: string;
  fullName: string;
  description?: string;
  url: string;
  provider: GitProviderType;
  defaultBranch: string;
  isPrivate: boolean;
  language?: string;
  topics?: string[];
  starsCount?: number;
  forksCount?: number;
}

/**
 * Options for updating a repository
 */
export interface UpdateRepositoryOptions {
  name?: string;
  description?: string;
  defaultBranch?: string;
}

/**
 * Repository sync status
 */
export interface RepositorySyncStatus {
  repositoryId: string;
  status: 'idle' | 'syncing' | 'success' | 'error';
  lastSyncedAt?: string;
  error?: string;
}

/**
 * Result type for repository operations
 */

export interface RepositoryServiceResult<T> {
  data: T | null;
  error: ApiError | null;
}

/**
 * GitHub repository metadata
 */
export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  private: boolean;
  default_branch: string;
  language: string | null;
  topics: string[];
  stargazers_count: number;
  forks_count: number;
  owner: {
    login: string;
    avatar_url: string;
  };
}
