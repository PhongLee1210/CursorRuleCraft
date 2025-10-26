import { SupabaseService } from '@backend/supabase/supabase.service';
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

/**
 * Global Supabase Module
 *
 * This module provides Supabase clients that use Clerk session tokens for authentication.
 * This respects Row Level Security (RLS) policies based on the authenticated user.
 *
 * @Global decorator makes this module available throughout the application
 * without needing to import it in every module.
 *
 * Note: Even though ConfigModule is global, we explicitly import it here to ensure
 * proper initialization order and avoid dependency injection issues.
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class SupabaseModule {}
