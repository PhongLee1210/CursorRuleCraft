import { ClerkToken } from '@/auth/decorators/clerk-token.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Public } from '@/auth/decorators/public.decorator';
import { IntegrationService } from '@/repositories/integration.service';
import { GitProvider } from '@/repositories/types/repository';
import { Controller, Get, HttpException, HttpStatus, Query, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

/**
 * GitHub OAuth Controller
 *
 * Handles GitHub OAuth flow for Git integration.
 */
@Controller('auth/github')
export class GitHubAuthController {
  constructor(
    private readonly gitIntegrationService: IntegrationService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Initiate GitHub OAuth flow
   * GET /auth/github/authorize
   *
   * This endpoint requires authentication to get the user's context.
   * We pass the user ID and Clerk token via the state parameter.
   * Returns the GitHub OAuth URL instead of redirecting.
   */
  @Get('authorize')
  async authorize(@ClerkToken() clerkToken: string, @CurrentUser('sub') userId: string) {
    const clientId = this.configService.get<string>('GITHUB_CLIENT_ID');
    const redirectUri = this.configService.get<string>(
      'GITHUB_REDIRECT_URI',
      'http://localhost:4000/api/auth/github/callback'
    );

    if (!clientId) {
      throw new HttpException('GitHub OAuth not configured', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // Encode user context in state parameter (for security, you might want to encrypt this)
    const state = Buffer.from(
      JSON.stringify({
        userId,
        clerkToken,
        timestamp: Date.now(),
      })
    ).toString('base64');

    // GitHub OAuth scopes for repository access
    const scopes = ['repo', 'read:user', 'user:email'];

    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes.join(',')}&state=${encodeURIComponent(state)}`;

    return { authUrl };
  }

  /**
   * Handle GitHub OAuth callback
   * GET /auth/github/callback?code=xxx&state=yyy
   *
   * This endpoint must be public because it's called by GitHub's OAuth redirect.
   * We decode the state parameter to get the user context.
   */
  @Public()
  @Get('callback')
  async callback(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');

    if (!code) {
      res.redirect(
        `${frontendUrl}/auth/callback/github?github=error&message=${encodeURIComponent('Authorization code is missing')}`
      );
      return;
    }

    if (!state) {
      res.redirect(
        `${frontendUrl}/auth/callback/github?github=error&message=${encodeURIComponent('State parameter is missing')}`
      );
      return;
    }

    try {
      // Decode state parameter to get user context
      const decodedState = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
      const { userId, clerkToken, timestamp } = decodedState;

      // Validate state is not too old (5 minutes)
      if (Date.now() - timestamp > 5 * 60 * 1000) {
        throw new Error('OAuth state expired. Please try again.');
      }

      // Exchange code for access token
      const tokenData = await this.gitIntegrationService.exchangeGitHubCode(code);

      // Get GitHub user information
      const ghUser = await this.gitIntegrationService.getGitHubUser(tokenData.access_token);

      // Calculate token expiration
      const expiresAt = tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : undefined;

      // Store Git integration using the user context from state
      await this.gitIntegrationService.upsertGitIntegration(clerkToken, {
        user_id: userId,
        provider: GitProvider.GITHUB,
        provider_user_id: ghUser.id.toString(),
        provider_username: ghUser.login,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expires_at: expiresAt,
        scopes: tokenData.scope.split(',').map((s) => s.trim()),
      });

      // Redirect to frontend success page
      res.redirect(`${frontendUrl}/auth/callback/github?github=connected`);
    } catch (error) {
      console.error('GitHub OAuth callback error:', error);

      // Redirect to frontend with error
      res.redirect(
        `${frontendUrl}/auth/callback/github?github=error&message=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`
      );
    }
  }

  /**
   * Get current user's GitHub integration status
   * GET /auth/github/status
   */
  @Get('status')
  async getStatus(@ClerkToken() clerkToken: string, @CurrentUser('sub') userId: string) {
    try {
      const integration = await this.gitIntegrationService.getUserGitIntegration(
        clerkToken,
        userId,
        GitProvider.GITHUB
      );

      if (!integration) {
        return {
          connected: false,
        };
      }

      // Don't expose sensitive tokens
      return {
        connected: true,
        username: integration.provider_username,
        scopes: integration.scopes,
        createdAt: integration.created_at,
      };
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to check GitHub status',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Disconnect GitHub integration
   * DELETE /auth/github/disconnect
   */
  @Get('disconnect')
  async disconnect(@ClerkToken() clerkToken: string, @CurrentUser('sub') userId: string) {
    try {
      const integration = await this.gitIntegrationService.getUserGitIntegration(
        clerkToken,
        userId,
        GitProvider.GITHUB
      );

      if (!integration) {
        throw new HttpException('GitHub integration not found', HttpStatus.NOT_FOUND);
      }

      await this.gitIntegrationService.deleteGitIntegration(clerkToken, integration.id);

      return { success: true };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to disconnect GitHub',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
