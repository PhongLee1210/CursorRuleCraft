import { GitProvider } from '@cursorrulecraft/shared-types';

// Re-export GitProvider for convenience
export { GitProvider };

/**
 * Repository entity from database
 */
export interface Repository {
  id: string;
  workspace_id: string;
  git_integration_id: string;
  name: string;
  full_name: string;
  description?: string;
  url: string;
  provider: GitProvider;
  provider_repo_id: string;
  default_branch: string;
  is_private: boolean;
  language?: string;
  topics?: string[];
  stars_count?: number;
  forks_count?: number;
  last_synced_at?: string;
  sync_status?: string;
  sync_error?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Options for adding a repository
 */
export interface AddRepositoryDto {
  workspace_id: string;
  git_integration_id: string;
  name: string;
  full_name: string;
  description?: string;
  url: string;
  provider: GitProvider;
  provider_repo_id: string;
  default_branch: string;
  is_private: boolean;
  language?: string;
  topics?: string[];
  stars_count?: number;
  forks_count?: number;
}

/**
 * Options for updating a repository
 */
export interface UpdateRepositoryDto {
  name?: string;
  description?: string;
  default_branch?: string;
  language?: string;
  topics?: string[];
  stars_count?: number;
  forks_count?: number;
}
