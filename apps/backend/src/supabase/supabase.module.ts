import { Global, Module } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

/**
 * Global Supabase Module
 *
 * This module provides a singleton Supabase client configured with the Service Role Key.
 * The Service Role Key bypasses all Row Level Security (RLS) policies, allowing
 * the backend to perform administrative operations on the database.
 *
 * @Global decorator makes this module available throughout the application
 * without needing to import it in every module.
 */
@Global()
@Module({
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class SupabaseModule {}
