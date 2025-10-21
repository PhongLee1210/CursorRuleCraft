import type { GitProviderType } from '@cursorrulecraft/shared-types';

/**
 * Git Integration entity from database
 */
export interface GitIntegration {
  id: string;
  user_id: string;
  provider: GitProviderType;
  provider_user_id: string;
  provider_username: string;
  access_token: string;
  refresh_token?: string;
  token_expires_at?: string;
  scopes: string[];
  // GitHub App Installation fields
  installation_id?: number; // GitHub App installation ID
  installation_token_expires_at?: string; // When the installation token expires (1 hour)
  auth_type?: 'oauth' | 'installation'; // Type of authentication
  created_at: string;
  updated_at: string;
}

/**
 * DTO for creating a Git integration
 */
export interface CreateGitIntegrationDto {
  user_id: string;
  provider: GitProviderType;
  provider_user_id: string;
  provider_username: string;
  access_token: string;
  refresh_token?: string;
  token_expires_at?: string;
  scopes: string[];
  // GitHub App Installation fields
  installation_id?: number;
  installation_token_expires_at?: string;
  auth_type?: 'oauth' | 'installation';
}

/**
 * GitHub repository data from API
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
}
