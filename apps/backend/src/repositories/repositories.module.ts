import { CursorRulesService } from '@backend/repositories/cursor-rules/cursor-rules.service';
import { GitHubAppService } from '@backend/repositories/github/github-app.service';
import { GitHubAuthController } from '@backend/repositories/github/github-auth.controller';
import { IntegrationService } from '@backend/repositories/github/integration.service';
import { RepositoriesController } from '@backend/repositories/repositories.controller';
import { RepositoriesService } from '@backend/repositories/repositories.service';
import { SupabaseModule } from '@backend/supabase/supabase.module';
import { WorkspacesModule } from '@backend/workspaces/workspaces.module';
import { Module } from '@nestjs/common';

/**
 * Repositories Module
 *
 * This module provides repository management functionality,
 * including Git integration, repository CRUD operations, and cursor rules management.
 */
@Module({
  imports: [SupabaseModule, WorkspacesModule],
  controllers: [RepositoriesController, GitHubAuthController],
  providers: [RepositoriesService, IntegrationService, GitHubAppService, CursorRulesService],
  exports: [RepositoriesService, IntegrationService, GitHubAppService, CursorRulesService],
})
export class RepositoriesModule {}
