import {
  CreateGitIntegrationDto,
  GitHubRepository,
  GitIntegration,
} from '@/repositories/types/integration';
import { GitProvider } from '@/repositories/types/repository';
import { SupabaseService } from '@/supabase/supabase.service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Git Integration Service
 *
 * This service handles OAuth integrations with Git providers
 * and provides methods to interact with their APIs.
 */
@Injectable()
export class IntegrationService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Create or update a Git integration for a user
   */
  async upsertGitIntegration(
    clerkToken: string,
    data: CreateGitIntegrationDto
  ): Promise<GitIntegration> {
    const client = this.supabaseService.getClientWithClerkToken(clerkToken);

    // Check if integration already exists
    const { data: existing } = await client
      .from('git_integrations')
      .select('*')
      .eq('user_id', data.user_id)
      .eq('provider', data.provider)
      .single();

    if (existing) {
      // Update existing integration
      const { data: updated, error } = await client
        .from('git_integrations')
        .update({
          provider_user_id: data.provider_user_id,
          provider_username: data.provider_username,
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          token_expires_at: data.token_expires_at,
          scopes: data.scopes,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update git integration: ${error.message}`);
      }

      return updated;
    }

    // Create new integration
    const { data: integration, error } = await client
      .from('git_integrations')
      .insert(data)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create git integration: ${error.message}`);
    }

    return integration;
  }

  /**
   * Get Git integration by ID
   */
  async getGitIntegrationById(clerkToken: string, integrationId: string): Promise<GitIntegration> {
    const client = this.supabaseService.getClientWithClerkToken(clerkToken);

    const { data, error } = await client
      .from('git_integrations')
      .select('*')
      .eq('id', integrationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Git integration not found');
      }
      throw new Error(`Failed to fetch git integration: ${error.message}`);
    }

    return data;
  }

  /**
   * Get user's Git integration for a specific provider
   */
  async getUserGitIntegration(
    clerkToken: string,
    userId: string,
    provider: GitProvider
  ): Promise<GitIntegration | null> {
    const client = this.supabaseService.getClientWithClerkToken(clerkToken);

    const { data, error } = await client
      .from('git_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch git integration: ${error.message}`);
    }

    return data;
  }

  /**
   * Get all Git integrations for a user
   */
  async getUserGitIntegrations(clerkToken: string, userId: string): Promise<GitIntegration[]> {
    const client = this.supabaseService.getClientWithClerkToken(clerkToken);

    const { data, error } = await client
      .from('git_integrations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch git integrations: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Delete a Git integration
   */
  async deleteGitIntegration(clerkToken: string, integrationId: string): Promise<boolean> {
    const client = this.supabaseService.getClientWithClerkToken(clerkToken);

    const { error } = await client.from('git_integrations').delete().eq('id', integrationId);

    if (error) {
      throw new Error(`Failed to delete git integration: ${error.message}`);
    }

    return true;
  }

  /**
   * Fetch repositories from GitHub API
   */
  async fetchGitHubRepositories(
    accessToken: string,
    page = 1,
    perPage = 30
  ): Promise<GitHubRepository[]> {
    try {
      const response = await fetch(
        `https://api.github.com/user/repos?page=${page}&per_page=${perPage}&sort=updated&affiliation=owner,collaborator`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`GitHub API error: ${error.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(
        `Failed to fetch GitHub repositories: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Fetch a single repository from GitHub API
   */
  async fetchGitHubRepository(
    accessToken: string,
    owner: string,
    repo: string
  ): Promise<GitHubRepository> {
    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`GitHub API error: ${error.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(
        `Failed to fetch GitHub repository: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get authenticated GitHub user information
   */
  async getGitHubUser(accessToken: string): Promise<{
    id: number;
    login: string;
    name: string;
    email: string;
    avatar_url: string;
  }> {
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`GitHub API error: ${error.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(
        `Failed to fetch GitHub user: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Exchange GitHub OAuth code for access token
   */
  async exchangeGitHubCode(code: string): Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    scope: string;
  }> {
    const clientId = this.configService.get<string>('GITHUB_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GITHUB_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('GitHub OAuth credentials not configured');
    }

    try {
      const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      });

      if (!response.ok) {
        throw new Error(`GitHub OAuth error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`GitHub OAuth error: ${data.error_description || data.error}`);
      }

      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        scope: data.scope,
      };
    } catch (error) {
      throw new Error(
        `Failed to exchange GitHub code: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
