import { ClerkToken } from '@/auth/decorators/clerk-token.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { IntegrationService } from '@/repositories/integration.service';
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
    private readonly workspacesService: WorkspacesService
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

      const repositories = await this.gitIntegrationService.fetchGitHubRepositories(
        integration.access_token,
        page ? parseInt(page) : 1,
        perPage ? parseInt(perPage) : 30
      );

      return { data: repositories };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
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
}
