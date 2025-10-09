import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase Service
 *
 * This service provides a singleton Supabase client instance configured with
 * the Service Role Key. This allows the backend to:
 *
 * 1. Bypass all Row Level Security (RLS) policies
 * 2. Perform administrative operations on the database
 * 3. Access all data regardless of user permissions
 *
 * ⚠️ WARNING: Never expose this client or service role key to the frontend!
 * The service role key has full database access and should only be used server-side.
 */
@Injectable()
export class SupabaseService implements OnModuleInit {
  private supabaseClient: SupabaseClient;

  constructor(private configService: ConfigService) {}

  /**
   * Initialize the Supabase client on module initialization
   */
  onModuleInit() {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseServiceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error(
        'Missing required Supabase configuration. Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file.'
      );
    }

    // Create Supabase client with Service Role Key
    // This client bypasses all RLS policies
    this.supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log('✅ Supabase client initialized with Service Role Key');
  }

  /**
   * Get the Supabase client instance
   *
   * This client has full database access via the Service Role Key.
   * Use with caution and never expose to the frontend.
   */
  getClient(): SupabaseClient {
    if (!this.supabaseClient) {
      throw new Error('Supabase client not initialized');
    }
    return this.supabaseClient;
  }

  /**
   * Example: Get all users (bypasses RLS)
   *
   * This is just an example method showing how to use the Supabase client.
   * You can add more methods here for your specific use cases.
   */
  async getAllUsers() {
    const { data, error } = await this.supabaseClient.from('users').select('*');

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    return data;
  }

  /**
   * Example: Create or update user
   *
   * This method demonstrates how to perform upsert operations
   * using the service role key which bypasses RLS.
   */
  async upsertUser(userId: string, userData: Record<string, any>) {
    const { data, error } = await this.supabaseClient
      .from('users')
      .upsert({ id: userId, ...userData }, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to upsert user: ${error.message}`);
    }

    return data;
  }
}
