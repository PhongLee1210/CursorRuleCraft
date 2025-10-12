import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createAppAuth } from '@octokit/auth-app';
import { Octokit } from '@octokit/rest';

/**
 * GitHub App Service
 *
 * This service handles GitHub App authentication using Installation Tokens.
 * Installation tokens are more reliable than OAuth tokens because:
 * - They auto-refresh (1-hour lifetime, regenerated on-demand)
 * - They don't require user re-authentication
 * - They can't be accidentally revoked by users
 * - They're generated programmatically using the private key
 */
@Injectable()
export class GitHubAppService {
  private appId: string;
  private privateKey: string;
  private octokit: Octokit | null = null;

  constructor(private readonly configService: ConfigService) {
    this.appId = this.configService.get<string>('GITHUB_APP_ID') || '';

    // Support both raw private key and base64 encoded
    const privateKeyRaw = this.configService.get<string>('GITHUB_APP_PRIVATE_KEY');
    const privateKeyBase64 = this.configService.get<string>('GITHUB_APP_PRIVATE_KEY_BASE64');

    if (privateKeyBase64) {
      this.privateKey = Buffer.from(privateKeyBase64, 'base64').toString('utf-8');
    } else if (privateKeyRaw) {
      // Replace literal \n with actual newlines
      this.privateKey = privateKeyRaw.replace(/\\n/g, '\n');
    } else {
      this.privateKey = '';
    }

    // Initialize Octokit with App auth if credentials are available
    if (this.appId && this.privateKey) {
      this.initializeOctokit();
    } else {
      console.warn(
        'GitHub App credentials not configured. Installation token generation will not be available.'
      );
    }
  }

  /**
   * Initialize Octokit with GitHub App authentication
   */
  private initializeOctokit(): void {
    try {
      this.octokit = new Octokit({
        authStrategy: createAppAuth,
        auth: {
          appId: this.appId,
          privateKey: this.privateKey,
        },
      });
      console.log('✅ GitHub App authentication initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize GitHub App authentication:', error);
      this.octokit = null;
    }
  }

  /**
   * Check if GitHub App authentication is configured and available
   */
  isConfigured(): boolean {
    return this.octokit !== null && this.appId !== '' && this.privateKey !== '';
  }

  /**
   * Generate an installation access token for a specific installation
   *
   * @param installationId - The GitHub App installation ID
   * @returns Installation access token (valid for 1 hour)
   */
  async generateInstallationToken(installationId: number): Promise<string> {
    if (!this.octokit) {
      throw new Error(
        'GitHub App not configured. Please set GITHUB_APP_ID and GITHUB_APP_PRIVATE_KEY.'
      );
    }

    try {
      const { data } = await this.octokit.apps.createInstallationAccessToken({
        installation_id: installationId,
      });

      console.log(`✅ Generated installation token for installation ${installationId}`);
      return data.token;
    } catch (error) {
      console.error(
        `❌ Failed to generate installation token for installation ${installationId}:`,
        error
      );
      throw new Error(
        `Failed to generate GitHub installation token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get installation ID for the authenticated user
   * This is useful when converting from OAuth to Installation tokens
   *
   * @param userAccessToken - User's OAuth token
   * @returns Installation ID if the app is installed for the user
   */
  async getInstallationIdForUser(userAccessToken: string): Promise<number | null> {
    try {
      // Create a temporary Octokit instance with the user's token
      const userOctokit = new Octokit({
        auth: userAccessToken,
      });

      // Get user's installations
      const { data: installations } =
        await userOctokit.apps.listInstallationsForAuthenticatedUser();

      // Find the installation for our app
      const installation = installations.installations.find(
        (inst) => inst.app_id === parseInt(this.appId)
      );

      return installation ? installation.id : null;
    } catch (error) {
      console.error('Failed to get installation ID for user:', error);
      return null;
    }
  }

  /**
   * Get installation details
   *
   * @param installationId - The installation ID
   * @returns Installation details including account info
   */
  async getInstallationDetails(installationId: number) {
    if (!this.octokit) {
      throw new Error('GitHub App not configured.');
    }

    try {
      const { data } = await this.octokit.apps.getInstallation({
        installation_id: installationId,
      });

      return {
        id: data.id,
        account: {
          login: (data.account as any)?.login || (data.account as any)?.name || '',
          type: (data.account as any)?.type || 'Organization',
          id: data.account?.id || 0,
        },
        permissions: data.permissions,
        events: data.events,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error(`Failed to get installation details for ${installationId}:`, error);
      throw new Error(
        `Failed to get installation details: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check if an installation token is valid
   *
   * @param token - Installation access token to validate
   * @returns true if valid, false otherwise
   */
  async validateInstallationToken(token: string): Promise<boolean> {
    try {
      const testOctokit = new Octokit({ auth: token });

      // Try to make a simple API call
      await testOctokit.users.getAuthenticated();

      return true;
    } catch (error) {
      return false;
    }
  }
}
