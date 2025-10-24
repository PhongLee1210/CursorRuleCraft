import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { CursorRulesService } from './cursor-rules/cursor-rules.service';
import { GitHubAppService } from './github/github-app.service';
import { GitHubAuthController } from './github/github-auth.controller';
import { IntegrationService } from './github/integration.service';
import { RepositoriesController } from './repositories.controller';
import { RepositoriesService } from './repositories.service';

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
