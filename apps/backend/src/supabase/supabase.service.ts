import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase Service with Clerk Integration
 *
 * This service creates Supabase clients that use Clerk session tokens for authentication.
 * This approach respects Row Level Security (RLS) policies based on the authenticated user.
 *
 * Reference: https://clerk.com/docs/guides/development/integrations/databases/supabase
 *
 * Key differences from the old approach:
 * - Uses Clerk session tokens instead of Service Role Key
 * - Respects RLS policies (doesn't bypass them)
 * - Each request gets a client scoped to the authenticated user
 *
 * Note: For admin operations that need to bypass RLS, create a separate service
 * with the Service Role Key (use sparingly and with caution).
 */
@Injectable()
export class SupabaseService {
  private supabaseUrl: string;
  private supabaseAnonKey: string;

  constructor(private readonly configService: ConfigService) {
    console.log('[SupabaseService] Constructor called');

    // Read environment variables using ConfigService
    this.supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    this.supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY');

    if (!this.supabaseUrl || !this.supabaseAnonKey) {
      throw new Error(
        'Missing required Supabase configuration. Please ensure SUPABASE_URL and SUPABASE_ANON_KEY are set in your .env file.'
      );
    }

    console.log('✅ Supabase service initialized with Clerk integration');
    console.log('   Supabase URL:', this.supabaseUrl);
  }

  /**
   * Create a Supabase client with Clerk session token
   *
   * This creates a client that respects RLS policies based on the Clerk user.
   * The Clerk session token is passed in the Authorization header and accessed
   * via auth.jwt()->>'sub' in RLS policies.
   *
   * @param clerkToken - The Clerk session token from the request
   * @returns SupabaseClient configured with the Clerk token
   */
  getClientWithClerkToken(clerkToken: string): SupabaseClient {
    if (!clerkToken) {
      throw new Error('Clerk token is required to create Supabase client');
    }

    // Create Supabase client with Clerk token
    // The token will be used in RLS policies via auth.jwt()
    return createClient(this.supabaseUrl, this.supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${clerkToken}`,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  /**
   * DEPRECATED: Get the admin Supabase client (bypasses RLS)
   *
   * This method is kept for backwards compatibility but should be avoided.
   * Instead, use getClientWithClerkToken() to respect RLS policies.
   *
   * For true admin operations, create a separate AdminSupabaseService.
   */
  getClient(): SupabaseClient {
    console.warn(
      '⚠️ WARNING: getClient() is deprecated. Use getClientWithClerkToken() instead to respect RLS policies.'
    );

    // For now, return a client with anon key
    // This will fail for operations that require authentication
    return createClient(this.supabaseUrl, this.supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
}
