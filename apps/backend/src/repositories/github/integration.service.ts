import { SupabaseService } from '@/supabase/supabase.service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GitProvider } from '../types/repository';
import { GitHubAppService } from './github-app.service';
import { CreateGitIntegrationDto, GitHubRepository, GitIntegration } from './integration.types';

/**
 * Git Integration Service
 *
 * This service handles OAuth integrations with Git providers
 * and provides methods to interact with their APIs.
 *
 * Supports both:
 * - OAuth tokens (can expire/be revoked)
 * - GitHub App installation tokens (auto-refresh, more reliable)
 */
@Injectable()
export class IntegrationService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService,
    private readonly githubAppService: GitHubAppService
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
    // Validate inputs
    if (!userId) {
      console.error('getUserGitIntegration called with empty userId');
      throw new Error('User ID is required to fetch git integration');
    }

    if (!clerkToken) {
      console.error('getUserGitIntegration called with empty clerkToken');
      throw new Error('Authentication token is required to fetch git integration');
    }

    const client = this.supabaseService.getClientWithClerkToken(clerkToken);

    const { data, error } = await client
      .from('git_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No matching row found - this is expected when user hasn't connected yet
        return null;
      }
      console.error(
        `Failed to fetch git integration for user ${userId}, provider ${provider}:`,
        error
      );
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
   * Get a valid access token for GitHub API calls
   *
   * This method handles both OAuth and Installation tokens:
   * - For OAuth: returns the stored token (may be expired)
   * - For Installation: generates a fresh token if expired
   *
   * @param integration - Git integration record
   * @param clerkToken - Clerk token for database updates
   * @returns Valid access token
   */
  async getValidAccessToken(integration: GitIntegration, clerkToken: string): Promise<string> {
    // For OAuth authentication, return the stored token
    if (integration.auth_type === 'oauth' || !integration.auth_type) {
      return integration.access_token;
    }

    // For Installation authentication, check if token needs refresh
    if (integration.auth_type === 'installation' && integration.installation_id) {
      const now = new Date();
      const expiresAt = integration.installation_token_expires_at
        ? new Date(integration.installation_token_expires_at)
        : new Date(0); // Expired date if not set

      // If token is still valid (with 5-minute buffer), return it
      const bufferMs = 5 * 60 * 1000; // 5 minutes
      if (expiresAt.getTime() - now.getTime() > bufferMs) {
        return integration.access_token;
      }

      // Token expired or about to expire, generate a new one
      console.log(
        `🔄 Installation token expired for integration ${integration.id}, generating new one...`
      );

      try {
        const newToken = await this.githubAppService.generateInstallationToken(
          integration.installation_id
        );

        // Update the stored token and expiration
        const newExpiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

        await this.updateIntegrationToken(clerkToken, integration.id, newToken, newExpiresAt);

        console.log(`✅ Generated new installation token for integration ${integration.id}`);
        return newToken;
      } catch (error) {
        console.error(`❌ Failed to refresh installation token for ${integration.id}:`, error);
        // Fall back to stored token (will likely fail, but let the error propagate naturally)
        return integration.access_token;
      }
    }

    // Fallback to stored token
    return integration.access_token;
  }

  /**
   * Update integration token and expiration
   * @private
   */
  private async updateIntegrationToken(
    clerkToken: string,
    integrationId: string,
    accessToken: string,
    expiresAt: Date
  ): Promise<void> {
    const client = this.supabaseService.getClientWithClerkToken(clerkToken);

    const { error } = await client
      .from('git_integrations')
      .update({
        access_token: accessToken,
        installation_token_expires_at: expiresAt.toISOString(),
      })
      .eq('id', integrationId);

    if (error) {
      console.error(`Failed to update integration token:`, error);
    }
  }

  /**
   * Migrate an OAuth integration to use GitHub App installation tokens
   * This is useful for converting existing OAuth integrations to the more reliable installation token approach
   *
   * @param integration - Existing OAuth integration
   * @param clerkToken - Clerk token for database updates
   * @returns Updated integration with installation token
   */
  async migrateToInstallationToken(
    integration: GitIntegration,
    clerkToken: string
  ): Promise<GitIntegration> {
    // Only works if GitHub App is configured
    if (!this.githubAppService.isConfigured()) {
      throw new Error('GitHub App not configured. Cannot migrate to installation tokens.');
    }

    // Get installation ID using the OAuth token
    const installationId = await this.githubAppService.getInstallationIdForUser(
      integration.access_token
    );

    if (!installationId) {
      throw new Error(
        'GitHub App is not installed for this user. Please install the GitHub App first.'
      );
    }

    // Generate an installation token
    const installationToken = await this.githubAppService.generateInstallationToken(installationId);

    // Update the integration record
    const client = this.supabaseService.getClientWithClerkToken(clerkToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    const { data, error } = await client
      .from('git_integrations')
      .update({
        installation_id: installationId,
        installation_token_expires_at: expiresAt.toISOString(),
        access_token: installationToken,
        auth_type: 'installation',
      })
      .eq('id', integration.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to migrate integration: ${error.message}`);
    }

    console.log(`✅ Migrated integration ${integration.id} to use installation tokens`);
    return data;
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
        // Handle 401 Unauthorized (Bad credentials) specifically
        if (response.status === 401) {
          throw new Error(
            'GITHUB_TOKEN_EXPIRED: Your GitHub access token has expired or been revoked. Please reconnect your GitHub account.'
          );
        }

        // Handle 403 Forbidden (Rate limit or permission issues)
        if (response.status === 403) {
          const error = await response.json().catch(() => ({}));
          if (error.message && error.message.includes('rate limit')) {
            throw new Error('GitHub API rate limit exceeded. Please try again later.');
          }
          throw new Error(
            'GitHub API access forbidden. Please check your permissions and try reconnecting your GitHub account.'
          );
        }

        // Handle other errors
        const error = await response.json().catch(() => ({ message: response.statusText }));
        console.error('GitHub API error:', { status: response.status, error });
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
   * Validate GitHub token by making a lightweight API call
   * Returns true if token is valid, false if revoked/expired
   */
  async validateGitHubToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Error validating GitHub token:', error);
      return false;
    }
  }

  /**
   * Check if a git integration token is still valid
   * If invalid, optionally delete the integration
   */
  async checkAndCleanInvalidIntegration(
    clerkToken: string,
    integrationId: string,
    accessToken: string
  ): Promise<boolean> {
    const isValid = await this.validateGitHubToken(accessToken);

    if (!isValid) {
      console.log(
        `Integration ${integrationId} has invalid token. Consider removing it from database.`
      );
      // Optionally auto-delete invalid integrations
      // await this.deleteGitIntegration(clerkToken, integrationId);
    }

    return isValid;
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

  /**
   * Fetch repository file tree from GitHub
   */
  async fetchGitHubFileTree(
    accessToken: string,
    owner: string,
    repo: string,
    branch?: string
  ): Promise<any> {
    try {
      // First, get the default branch if not provided
      let branchToUse = branch;
      if (!branchToUse) {
        const repoData = await this.fetchGitHubRepository(accessToken, owner, repo);
        branchToUse = repoData.default_branch;
      }

      // Get the tree recursively
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/trees/${branchToUse}?recursive=1`,
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

      const data = await response.json();

      // Transform flat tree into hierarchical structure
      return this.buildFileTree(data.tree);
    } catch (error) {
      throw new Error(
        `Failed to fetch GitHub file tree: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Fetch file content from GitHub
   */
  async fetchGitHubFileContent(
    accessToken: string,
    owner: string,
    repo: string,
    path: string,
    branch?: string
  ): Promise<string> {
    try {
      const ref = branch ? `?ref=${branch}` : '';
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}${ref}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github.raw+json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`GitHub API error: ${error.message || response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      throw new Error(
        `Failed to fetch GitHub file content: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Build hierarchical file tree from flat GitHub tree
   */
  private buildFileTree(flatTree: any[]): any[] {
    const root: any[] = [];
    const pathMap = new Map<string, any>();

    // Filter out .git directory and other hidden files/directories
    const filteredTree = flatTree.filter(
      (item) => !item.path.startsWith('.git/') && !item.path.startsWith('.')
    );

    // Sort by path to ensure parents are processed before children
    filteredTree.sort((a, b) => a.path.localeCompare(b.path));

    for (const item of filteredTree) {
      const parts = item.path.split('/');
      const name = parts[parts.length - 1];
      const parentPath = parts.slice(0, -1).join('/');

      const node = {
        name,
        path: item.path,
        type: item.type === 'tree' ? 'directory' : 'file',
        children: item.type === 'tree' ? [] : undefined,
      };

      pathMap.set(item.path, node);

      if (parentPath) {
        const parent = pathMap.get(parentPath);
        if (parent && parent.children) {
          parent.children.push(node);
        }
      } else {
        root.push(node);
      }
    }

    // Sort tree: directories first, then alphabetically (like GitHub)
    this.sortFileTree(root);

    return root;
  }

  /**
   * Sort file tree nodes: directories first, then files, both alphabetically
   * This matches GitHub's file tree sorting behavior
   */
  private sortFileTree(nodes: any[]): void {
    nodes.sort((a, b) => {
      // Directories come before files
      if (a.type === 'directory' && b.type === 'file') {
        return -1;
      }
      if (a.type === 'file' && b.type === 'directory') {
        return 1;
      }
      // Within same type, sort alphabetically (case-insensitive)
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });

    // Recursively sort children
    for (const node of nodes) {
      if (node.children && node.children.length > 0) {
        this.sortFileTree(node.children);
      }
    }
  }
}
