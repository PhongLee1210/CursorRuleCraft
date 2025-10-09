import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

/**
 * Users Service
 *
 * This service interacts with Supabase using the Service Role Key.
 * All operations here bypass RLS policies.
 */
@Injectable()
export class UsersService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Create a new user
   */
  async createUser(userData: any) {
    const client = this.supabaseService.getClient();

    const userInsert = {
      id: userData.id,
      name: userData.name,
      email: userData.email?.toLowerCase(),
      username: userData.username?.toLowerCase(),
      picture: userData.picture ?? null,
      locale: userData.locale ?? 'en-US',
      email_verified: userData.emailVerified ?? false,
      two_factor_enabled: false,
      provider: userData.provider ?? 'email',
    };

    const { data, error } = await client.from('users').insert(userInsert).select().single();

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    return data;
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string) {
    const client = this.supabaseService.getClient();

    const { data, error } = await client.from('users').select('*').eq('id', userId).single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('User not found');
      }
      throw new Error(`Failed to fetch user: ${error.message}`);
    }

    return data;
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string) {
    const client = this.supabaseService.getClient();

    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('User not found');
      }
      throw new Error(`Failed to fetch user: ${error.message}`);
    }

    return data;
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username: string) {
    const client = this.supabaseService.getClient();

    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('username', username.toLowerCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('User not found');
      }
      throw new Error(`Failed to fetch user: ${error.message}`);
    }

    return data;
  }

  /**
   * Check if username is available
   */
  async isUsernameAvailable(username: string, excludeUserId?: string) {
    const client = this.supabaseService.getClient();

    let query = client
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('username', username.toLowerCase());

    if (excludeUserId) {
      query = query.neq('id', excludeUserId);
    }

    const { count, error } = await query;

    if (error) {
      throw new Error(`Failed to check username: ${error.message}`);
    }

    return count === 0;
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updates: Record<string, any>) {
    const client = this.supabaseService.getClient();

    const userUpdate: Record<string, any> = {
      name: updates.name,
      picture: updates.picture,
      username: updates.username?.toLowerCase(),
      locale: updates.locale,
      email_verified: updates.emailVerified,
      two_factor_enabled: updates.twoFactorEnabled,
      updated_at: new Date().toISOString(),
    };

    // Remove undefined values
    Object.keys(userUpdate).forEach((key) => {
      if (userUpdate[key] === undefined) {
        delete userUpdate[key];
      }
    });

    const { data, error } = await client
      .from('users')
      .update(userUpdate)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string) {
    const client = this.supabaseService.getClient();

    const { error } = await client.from('users').delete().eq('id', userId);

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }

    return true;
  }

  /**
   * Get users with filters and pagination
   */
  async getUsers(filters?: any, pagination?: any) {
    const client = this.supabaseService.getClient();

    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = client.from('users').select('*', { count: 'exact' });

    // Apply filters
    if (filters?.email) {
      query = query.eq('email', filters.email.toLowerCase());
    }
    if (filters?.username) {
      query = query.eq('username', filters.username.toLowerCase());
    }
    if (filters?.provider) {
      query = query.eq('provider', filters.provider);
    }

    // Apply pagination
    query = query.range(from, to).order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    const total = count ?? 0;

    return {
      data: data ?? [],
      total,
      page,
      limit,
      hasMore: to < total - 1,
    };
  }

  /**
   * Sync user from Clerk to Supabase
   */
  async syncUserFromClerk(clerkUserId: string, clerkUserData: any) {
    const client = this.supabaseService.getClient();

    // Try to get existing user
    const { data: existingUser } = await client
      .from('users')
      .select('*')
      .eq('id', clerkUserId)
      .single();

    const userData = {
      email: clerkUserData.email || clerkUserData.emailAddresses?.[0]?.emailAddress,
      name:
        clerkUserData.name ||
        `${clerkUserData.firstName || ''} ${clerkUserData.lastName || ''}`.trim(),
      picture: clerkUserData.picture || clerkUserData.imageUrl,
      updated_at: new Date().toISOString(),
    };

    // If user exists, update
    if (existingUser) {
      return this.updateUserProfile(clerkUserId, userData);
    }

    // If user doesn't exist, create
    return this.createUser({
      id: clerkUserId,
      ...userData,
      username: clerkUserData.username || clerkUserData.email?.split('@')[0],
    });
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers() {
    return this.supabaseService.getAllUsers();
  }
}
