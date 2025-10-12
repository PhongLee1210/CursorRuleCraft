import { ClerkToken } from '@/auth/decorators/clerk-token.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { CreateRuleDto, UpdateRuleDto } from '@/repositories/cursor-rules/cursor-rules.dto';
import { CursorRulesService } from '@/repositories/cursor-rules/cursor-rules.service';
import { IntegrationService } from '@/repositories/github/integration.service';
import { RepositoriesService } from '@/repositories/repositories.service';
import {
  AddRepositoryDto,
  GitProvider,
  UpdateRepositoryDto,
} from '@/repositories/types/repository';
import { WorkspacesService } from '@/workspaces/workspaces.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';

/**
 * Repositories Controller
 *
 * Handles HTTP requests for repository management.
 * All routes are protected by ClerkAuthGuard (applied globally).
 */
@Controller('repositories')
export class RepositoriesController {
  constructor(
    private readonly repositoriesService: RepositoriesService,
    private readonly gitIntegrationService: IntegrationService,
    private readonly workspacesService: WorkspacesService,
    private readonly cursorRulesService: CursorRulesService
  ) {}

  /**
   * Get all repositories for a workspace
   * GET /repositories?workspaceId=xxx
   */
  @Get()
  async getWorkspaceRepositories(
    @ClerkToken() clerkToken: string,
    @Query('workspaceId') workspaceId: string
  ) {
    if (!workspaceId) {
      throw new HttpException('workspaceId query parameter is required', HttpStatus.BAD_REQUEST);
    }

    // Check if user has access to workspace
    const hasAccess = await this.workspacesService.hasWorkspaceAccess(clerkToken, workspaceId);

    if (!hasAccess) {
      throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
    }

    try {
      const repositories = await this.repositoriesService.getWorkspaceRepositories(
        clerkToken,
        workspaceId
      );
      return { data: repositories };
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to fetch repositories',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Fetch available repositories from GitHub
   * GET /repositories/github/available
   * NOTE: This must come BEFORE @Get(':id') to prevent 'github' from being matched as an ID
   */
  @Get('github/available')
  async getAvailableGitHubRepositories(
    @ClerkToken() clerkToken: string,
    @CurrentUser('sub') userId: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string
  ) {
    try {
      // Validate userId
      if (!userId) {
        console.error('User ID is missing from authentication token');
        throw new HttpException(
          'User authentication failed. User ID not found in token.',
          HttpStatus.UNAUTHORIZED
        );
      }

      // Get user's GitHub integration
      const integration = await this.gitIntegrationService.getUserGitIntegration(
        clerkToken,
        userId,
        GitProvider.GITHUB
      );

      if (!integration) {
        // Return empty array with a message instead of 404
        return {
          data: [],
          message:
            'GitHub account not connected. Please connect your GitHub account to view repositories.',
          requiresSetup: true,
        };
      }

      // Get a valid access token (handles both OAuth and installation tokens)
      const accessToken = await this.gitIntegrationService.getValidAccessToken(
        integration,
        clerkToken
      );

      const repositories = await this.gitIntegrationService.fetchGitHubRepositories(
        accessToken,
        page ? parseInt(page) : 1,
        perPage ? parseInt(perPage) : 30
      );

      return { data: repositories };
    } catch (error) {
      // Log the error for debugging
      console.error('Error in getAvailableGitHubRepositories:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      // Check if it's a token expiration error
      if (error instanceof Error && error.message.includes('GITHUB_TOKEN_EXPIRED')) {
        return {
          data: [],
          message:
            'Your GitHub access token has expired. Please reconnect your GitHub account to continue.',
          requiresReconnect: true,
          error: 'token_expired',
        };
      }

      // Check if it's a rate limit error
      if (error instanceof Error && error.message.includes('rate limit')) {
        throw new HttpException(
          'GitHub API rate limit exceeded. Please try again later.',
          HttpStatus.TOO_MANY_REQUESTS
        );
      }

      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to fetch GitHub repositories',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get a single repository by ID
   * GET /repositories/:id
   * NOTE: This must come AFTER specific routes like 'github/available'
   */
  @Get(':id')
  async getRepository(@ClerkToken() clerkToken: string, @Param('id') repositoryId: string) {
    try {
      const repository = await this.repositoriesService.getRepositoryById(clerkToken, repositoryId);

      // Check if user has access to the workspace this repository belongs to
      const hasAccess = await this.workspacesService.hasWorkspaceAccess(
        clerkToken,
        repository.workspace_id
      );

      if (!hasAccess) {
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
      }

      return { data: repository };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to fetch repository',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Add a repository to a workspace
   * POST /repositories
   */
  @Post()
  async addRepository(@ClerkToken() clerkToken: string, @Body() body: AddRepositoryDto) {
    // Check if user is admin of the workspace
    const isAdmin = await this.workspacesService.isWorkspaceAdmin(clerkToken, body.workspace_id);

    if (!isAdmin) {
      throw new HttpException('Only workspace admins can add repositories', HttpStatus.FORBIDDEN);
    }

    try {
      const repository = await this.repositoriesService.addRepository(clerkToken, body);
      return { data: repository };
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to add repository',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Update a repository
   * PUT /repositories/:id
   */
  @Put(':id')
  async updateRepository(
    @ClerkToken() clerkToken: string,
    @Param('id') repositoryId: string,
    @Body() body: UpdateRepositoryDto
  ) {
    try {
      // Get repository to check workspace access
      const repository = await this.repositoriesService.getRepositoryById(clerkToken, repositoryId);

      // Check if user is admin of the workspace
      const isAdmin = await this.workspacesService.isWorkspaceAdmin(
        clerkToken,
        repository.workspace_id
      );

      if (!isAdmin) {
        throw new HttpException(
          'Only workspace admins can update repositories',
          HttpStatus.FORBIDDEN
        );
      }

      const updatedRepository = await this.repositoriesService.updateRepository(
        clerkToken,
        repositoryId,
        body
      );
      return { data: updatedRepository };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to update repository',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Delete a repository
   * DELETE /repositories/:id
   */
  @Delete(':id')
  async deleteRepository(@ClerkToken() clerkToken: string, @Param('id') repositoryId: string) {
    try {
      // Get repository to check workspace access
      const repository = await this.repositoriesService.getRepositoryById(clerkToken, repositoryId);

      // Check if user is admin of the workspace
      const isAdmin = await this.workspacesService.isWorkspaceAdmin(
        clerkToken,
        repository.workspace_id
      );

      if (!isAdmin) {
        throw new HttpException(
          'Only workspace admins can delete repositories',
          HttpStatus.FORBIDDEN
        );
      }

      await this.repositoriesService.deleteRepository(clerkToken, repositoryId);
      return { success: true };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to delete repository',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Sync repository metadata from Git provider
   * POST /repositories/:id/sync
   */
  @Post(':id/sync')
  async syncRepository(@ClerkToken() clerkToken: string, @Param('id') repositoryId: string) {
    try {
      // Get repository to check workspace access
      const repository = await this.repositoriesService.getRepositoryById(clerkToken, repositoryId);

      // Check if user has access to workspace
      const hasAccess = await this.workspacesService.hasWorkspaceAccess(
        clerkToken,
        repository.workspace_id
      );

      if (!hasAccess) {
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
      }

      const updatedRepository = await this.repositoriesService.syncRepositoryMetadata(
        clerkToken,
        repositoryId
      );
      return { data: updatedRepository };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to sync repository',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Connect a GitHub repository to a workspace
   * POST /repositories/github/connect
   */
  @Post('github/connect')
  async connectGitHubRepository(
    @ClerkToken() clerkToken: string,
    @CurrentUser('sub') userId: string,
    @Body()
    body: {
      workspaceId: string;
      owner: string;
      repo: string;
    }
  ) {
    const { workspaceId, owner, repo } = body;

    if (!workspaceId || !owner || !repo) {
      throw new HttpException('workspaceId, owner, and repo are required', HttpStatus.BAD_REQUEST);
    }

    // Check if user is admin of the workspace
    const isAdmin = await this.workspacesService.isWorkspaceAdmin(clerkToken, workspaceId);

    if (!isAdmin) {
      throw new HttpException(
        'Only workspace admins can connect repositories',
        HttpStatus.FORBIDDEN
      );
    }

    try {
      // Get user's GitHub integration
      const integration = await this.gitIntegrationService.getUserGitIntegration(
        clerkToken,
        userId,
        GitProvider.GITHUB
      );

      if (!integration) {
        throw new HttpException(
          'GitHub integration not found. Please connect your GitHub account first.',
          HttpStatus.BAD_REQUEST
        );
      }

      // Fetch repository details from GitHub
      const ghRepo = await this.gitIntegrationService.fetchGitHubRepository(
        integration.access_token,
        owner,
        repo
      );

      // Add repository to workspace
      const repository = await this.repositoriesService.addRepository(clerkToken, {
        workspace_id: workspaceId,
        git_integration_id: integration.id,
        name: ghRepo.name,
        full_name: ghRepo.full_name,
        description: ghRepo.description || undefined,
        url: ghRepo.html_url,
        provider: GitProvider.GITHUB,
        provider_repo_id: ghRepo.id.toString(),
        default_branch: ghRepo.default_branch,
        is_private: ghRepo.private,
        language: ghRepo.language || undefined,
        topics: ghRepo.topics || [],
        stars_count: ghRepo.stargazers_count,
        forks_count: ghRepo.forks_count,
      });

      return { data: repository };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to connect GitHub repository',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get repository file tree
   * GET /repositories/:id/tree
   */
  @Get(':id/tree')
  async getRepositoryFileTree(
    @ClerkToken() clerkToken: string,
    @CurrentUser('sub') userId: string,
    @Param('id') repositoryId: string,
    @Query('branch') branch?: string
  ) {
    try {
      // Get repository to check workspace access
      const repository = await this.repositoriesService.getRepositoryById(clerkToken, repositoryId);

      // Check if user has access to workspace
      const hasAccess = await this.workspacesService.hasWorkspaceAccess(
        clerkToken,
        repository.workspace_id
      );

      if (!hasAccess) {
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
      }

      // Get git integration
      const integration = await this.gitIntegrationService.getGitIntegrationById(
        clerkToken,
        repository.git_integration_id
      );

      // Parse owner and repo from full_name (e.g., "owner/repo")
      const [owner, repo] = repository.full_name.split('/');

      // Fetch file tree from GitHub
      const fileTree = await this.gitIntegrationService.fetchGitHubFileTree(
        integration.access_token,
        owner,
        repo,
        branch || repository.default_branch
      );

      return { data: fileTree };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to fetch repository file tree',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get file content from repository
   * GET /repositories/:id/file
   */
  @Get(':id/file')
  async getRepositoryFileContent(
    @ClerkToken() clerkToken: string,
    @CurrentUser('sub') userId: string,
    @Param('id') repositoryId: string,
    @Query('path') path: string,
    @Query('branch') branch?: string
  ) {
    if (!path) {
      throw new HttpException('path query parameter is required', HttpStatus.BAD_REQUEST);
    }

    try {
      // Get repository to check workspace access
      const repository = await this.repositoriesService.getRepositoryById(clerkToken, repositoryId);

      // Check if user has access to workspace
      const hasAccess = await this.workspacesService.hasWorkspaceAccess(
        clerkToken,
        repository.workspace_id
      );

      if (!hasAccess) {
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
      }

      // Get git integration
      const integration = await this.gitIntegrationService.getGitIntegrationById(
        clerkToken,
        repository.git_integration_id
      );

      // Parse owner and repo from full_name (e.g., "owner/repo")
      const [owner, repo] = repository.full_name.split('/');

      // Fetch file content from GitHub
      const content = await this.gitIntegrationService.fetchGitHubFileContent(
        integration.access_token,
        owner,
        repo,
        path,
        branch || repository.default_branch
      );

      return { data: { content, path } };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to fetch file content',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ============================================================================
  // CURSOR RULES ENDPOINTS
  // ============================================================================

  /**
   * Get virtual tree structure of cursor rules
   * GET /repositories/:id/rules/tree
   */
  @Get(':id/rules/tree')
  async getRulesTree(@ClerkToken() clerkToken: string, @Param('id') repositoryId: string) {
    try {
      // Get repository to check workspace access
      const repository = await this.repositoriesService.getRepositoryById(clerkToken, repositoryId);

      // Check if user has access to workspace
      const hasAccess = await this.workspacesService.hasWorkspaceAccess(
        clerkToken,
        repository.workspace_id
      );

      if (!hasAccess) {
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
      }

      const tree = await this.cursorRulesService.getRulesTree(clerkToken, repositoryId);
      return { data: tree };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to fetch rules tree',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get all rules for a repository
   * GET /repositories/:id/rules
   */
  @Get(':id/rules')
  async getRepositoryRules(
    @ClerkToken() clerkToken: string,
    @Param('id') repositoryId: string,
    @Query('active') activeOnly?: string
  ) {
    try {
      // Get repository to check workspace access
      const repository = await this.repositoriesService.getRepositoryById(clerkToken, repositoryId);

      // Check if user has access to workspace
      const hasAccess = await this.workspacesService.hasWorkspaceAccess(
        clerkToken,
        repository.workspace_id
      );

      if (!hasAccess) {
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
      }

      const rules =
        activeOnly === 'true'
          ? await this.cursorRulesService.getActiveRules(clerkToken, repositoryId)
          : await this.cursorRulesService.getRules(clerkToken, repositoryId);

      return { data: rules };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to fetch rules',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get a specific rule by ID
   * GET /repositories/:id/rules/:ruleId
   */
  @Get(':id/rules/:ruleId')
  async getRule(
    @ClerkToken() clerkToken: string,
    @Param('id') repositoryId: string,
    @Param('ruleId') ruleId: string
  ) {
    try {
      // Get repository to check workspace access
      const repository = await this.repositoriesService.getRepositoryById(clerkToken, repositoryId);

      // Check if user has access to workspace
      const hasAccess = await this.workspacesService.hasWorkspaceAccess(
        clerkToken,
        repository.workspace_id
      );

      if (!hasAccess) {
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
      }

      const rule = await this.cursorRulesService.getRuleById(clerkToken, ruleId);

      // Verify rule belongs to this repository
      if (rule.repository_id !== repositoryId) {
        throw new HttpException('Rule not found in this repository', HttpStatus.NOT_FOUND);
      }

      return { data: rule };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to fetch rule',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Create a new rule
   * POST /repositories/:id/rules
   */
  @Post(':id/rules')
  async createRule(
    @ClerkToken() clerkToken: string,
    @CurrentUser('sub') userId: string,
    @Param('id') repositoryId: string,
    @Body() body: CreateRuleDto
  ) {
    try {
      // Get repository to check workspace access
      const repository = await this.repositoriesService.getRepositoryById(clerkToken, repositoryId);

      // Check if user has access to workspace
      const hasAccess = await this.workspacesService.hasWorkspaceAccess(
        clerkToken,
        repository.workspace_id
      );

      if (!hasAccess) {
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
      }

      const rule = await this.cursorRulesService.createRule(clerkToken, userId, repositoryId, body);
      return { data: rule };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to create rule',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Update a rule
   * PUT /repositories/:id/rules/:ruleId
   */
  @Put(':id/rules/:ruleId')
  async updateRule(
    @ClerkToken() clerkToken: string,
    @Param('id') repositoryId: string,
    @Param('ruleId') ruleId: string,
    @Body() body: UpdateRuleDto
  ) {
    try {
      // Get repository to check workspace access
      const repository = await this.repositoriesService.getRepositoryById(clerkToken, repositoryId);

      // Check if user has access to workspace
      const hasAccess = await this.workspacesService.hasWorkspaceAccess(
        clerkToken,
        repository.workspace_id
      );

      if (!hasAccess) {
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
      }

      // Get rule to verify it belongs to this repository
      const existingRule = await this.cursorRulesService.getRuleById(clerkToken, ruleId);
      if (existingRule.repository_id !== repositoryId) {
        throw new HttpException('Rule not found in this repository', HttpStatus.NOT_FOUND);
      }

      const rule = await this.cursorRulesService.updateRule(clerkToken, ruleId, body);
      return { data: rule };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to update rule',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Delete a rule
   * DELETE /repositories/:id/rules/:ruleId
   */
  @Delete(':id/rules/:ruleId')
  async deleteRule(
    @ClerkToken() clerkToken: string,
    @Param('id') repositoryId: string,
    @Param('ruleId') ruleId: string
  ) {
    try {
      // Get repository to check workspace access
      const repository = await this.repositoriesService.getRepositoryById(clerkToken, repositoryId);

      // Check if user has access to workspace
      const hasAccess = await this.workspacesService.hasWorkspaceAccess(
        clerkToken,
        repository.workspace_id
      );

      if (!hasAccess) {
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
      }

      // Get rule to verify it belongs to this repository
      const existingRule = await this.cursorRulesService.getRuleById(clerkToken, ruleId);
      if (existingRule.repository_id !== repositoryId) {
        throw new HttpException('Rule not found in this repository', HttpStatus.NOT_FOUND);
      }

      await this.cursorRulesService.deleteRule(clerkToken, ruleId);
      return { success: true };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to delete rule',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
