import { GitProvider } from './repository';

/**
 * Git Integration entity from database
 */
export interface GitIntegration {
  id: string;
  user_id: string;
  provider: GitProvider;
  provider_user_id: string;
  provider_username: string;
  access_token: string;
  refresh_token?: string;
  token_expires_at?: string;
  scopes: string[];
  created_at: string;
  updated_at: string;
}

/**
 * DTO for creating a Git integration
 */
export interface CreateGitIntegrationDto {
  user_id: string;
  provider: GitProvider;
  provider_user_id: string;
  provider_username: string;
  access_token: string;
  refresh_token?: string;
  token_expires_at?: string;
  scopes: string[];
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
