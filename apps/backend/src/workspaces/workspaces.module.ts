import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';

/**
 * Workspaces Module
 *
 * This module provides workspace management functionality including:
 * 1. Creating and managing workspaces
 * 2. Managing workspace members and their roles
 * 3. Role-based access control (OWNER, ADMIN, MEMBER)
 * 4. Integration with Supabase using Clerk JWT tokens
 *
 * Note: Even though SupabaseModule is @Global(), we import it explicitly
 * to ensure proper initialization order
 */
@Module({
  imports: [SupabaseModule],
  controllers: [WorkspacesController],
  providers: [WorkspacesService],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
