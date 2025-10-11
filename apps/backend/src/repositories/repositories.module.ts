import { GitHubAuthController } from '@/repositories/github.controller';
import { IntegrationService } from '@/repositories/integration.service';
import { RepositoriesController } from '@/repositories/repositories.controller';
import { RepositoriesService } from '@/repositories/repositories.service';
import { SupabaseModule } from '@/supabase/supabase.module';
import { WorkspacesModule } from '@/workspaces/workspaces.module';
import { Module } from '@nestjs/common';

/**
 * Repositories Module
 *
 * This module provides repository management functionality,
 * including Git integration and repository CRUD operations.
 */
@Module({
  imports: [SupabaseModule, WorkspacesModule],
  controllers: [RepositoriesController, GitHubAuthController],
  providers: [RepositoriesService, IntegrationService],
  exports: [RepositoriesService, IntegrationService],
})
export class RepositoriesModule {}
