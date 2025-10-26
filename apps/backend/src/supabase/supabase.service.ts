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
  private supabaseServiceRoleKey: string;

  constructor(private readonly configService: ConfigService) {
    console.log('[SupabaseService] Constructor called');

    // Read environment variables using ConfigService
    this.supabaseUrl = this.configService.get<string>('SUPABASE_URL') ?? '';
    this.supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY') ?? '';
    this.supabaseServiceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!this.supabaseUrl || !this.supabaseAnonKey) {
      throw new Error(
        'Missing required Supabase configuration. Please ensure SUPABASE_URL and SUPABASE_ANON_KEY are set in your .env file.'
      );
    }

    if (!this.supabaseServiceRoleKey) {
      console.warn(
        '⚠️ WARNING: SUPABASE_SERVICE_ROLE_KEY not found. Webhook functionality may not work properly.'
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
   * Get a Supabase client with Service Role Key (bypasses RLS)
   *
   * This creates a client that bypasses Row Level Security policies.
   * Use this sparingly and only for admin operations like webhook handlers.
   *
   * WARNING: This bypasses all RLS policies, so use with extreme caution!
   *
   * @returns SupabaseClient configured with service role key
   */
  getServiceRoleClient(): SupabaseClient {
    if (!this.supabaseServiceRoleKey) {
      throw new Error(
        'SUPABASE_SERVICE_ROLE_KEY is required for service role operations. Please configure it in your .env file.'
      );
    }

    return createClient(this.supabaseUrl, this.supabaseServiceRoleKey, {
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
   * For true admin operations, use getServiceRoleClient() instead.
   */
  getClient(): SupabaseClient {
    console.warn(
      '⚠️ WARNING: getClient() is deprecated. Use getServiceRoleClient() for admin operations or getClientWithClerkToken() for user-scoped operations.'
    );

    // Return service role client for backwards compatibility
    return this.getServiceRoleClient();
  }
}
