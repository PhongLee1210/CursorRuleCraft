import type { Database } from '@/types/database';
import type { UserDto } from '@/types/user';
import type { SupabaseClient } from '@supabase/supabase-js';
import { mapToUserDto } from './mapper';
import type {
  CreateUserOptions,
  PaginatedResult,
  PaginationOptions,
  ServiceResult,
  UserQueryFilters,
} from './types';
import { updateUser } from './update-user';

/**
 * Create a new user in Supabase
 * This is typically called after a user signs up with Clerk
 */
export async function createUser(
  supabase: SupabaseClient<Database>,
  options: CreateUserOptions
): Promise<ServiceResult<UserDto>> {
  try {
    const userInsert: Record<string, any> = {
      id: options.id,
      name: options.name,
      email: options.email.toLowerCase(),
      username: options.username.toLowerCase(),
      picture: options.picture ?? null,
      locale: options.locale ?? 'en-US',
      email_verified: options.emailVerified ?? false,
      two_factor_enabled: false,
      provider: options.provider ?? 'email',
    };

    const { data, error } = await (supabase.from('users') as any)
      .insert(userInsert)
      .select()
      .single();

    if (error) {
      console.error('[UserService] Error creating user:', error);
      return {
        data: null,
        error: new Error(`Failed to create user: ${error.message}`),
      };
    }

    return {
      data: mapToUserDto(data),
      error: null,
    };
  } catch (error) {
    console.error('[UserService] Unexpected error creating user:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error occurred'),
    };
  }
}

/**
 * Get a user by their ID
 */
export async function getUserById(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<ServiceResult<UserDto>> {
  try {
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();

    if (error) {
      // Handle "not found" case gracefully
      if (error.code === 'PGRST116') {
        return {
          data: null,
          error: new Error('User not found'),
        };
      }

      console.error('[UserService] Error fetching user by ID:', error);
      return {
        data: null,
        error: new Error(`Failed to fetch user: ${error.message}`),
      };
    }

    return {
      data: mapToUserDto(data),
      error: null,
    };
  } catch (error) {
    console.error('[UserService] Unexpected error fetching user by ID:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error occurred'),
    };
  }
}

/**
 * Get a user by their email
 */
export async function getUserByEmail(
  supabase: SupabaseClient<Database>,
  email: string
): Promise<ServiceResult<UserDto>> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          data: null,
          error: new Error('User not found'),
        };
      }

      console.error('[UserService] Error fetching user by email:', error);
      return {
        data: null,
        error: new Error(`Failed to fetch user: ${error.message}`),
      };
    }

    return {
      data: mapToUserDto(data),
      error: null,
    };
  } catch (error) {
    console.error('[UserService] Unexpected error fetching user by email:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error occurred'),
    };
  }
}

/**
 * Get a user by their username
 */
export async function getUserByUsername(
  supabase: SupabaseClient<Database>,
  username: string
): Promise<ServiceResult<UserDto>> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username.toLowerCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          data: null,
          error: new Error('User not found'),
        };
      }

      console.error('[UserService] Error fetching user by username:', error);
      return {
        data: null,
        error: new Error(`Failed to fetch user: ${error.message}`),
      };
    }

    return {
      data: mapToUserDto(data),
      error: null,
    };
  } catch (error) {
    console.error('[UserService] Unexpected error fetching user by username:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error occurred'),
    };
  }
}

/**
 * Check if a username is available
 */
export async function isUsernameAvailable(
  supabase: SupabaseClient<Database>,
  username: string,
  excludeUserId?: string
): Promise<ServiceResult<boolean>> {
  try {
    let query = supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('username', username.toLowerCase());

    if (excludeUserId) {
      query = query.neq('id', excludeUserId);
    }

    const { count, error } = await query;

    if (error) {
      console.error('[UserService] Error checking username availability:', error);
      return {
        data: null,
        error: new Error(`Failed to check username: ${error.message}`),
      };
    }

    return {
      data: count === 0,
      error: null,
    };
  } catch (error) {
    console.error('[UserService] Unexpected error checking username:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error occurred'),
    };
  }
}

/**
 * Get users with filters and pagination
 */
export async function getUsers(
  supabase: SupabaseClient<Database>,
  filters?: UserQueryFilters,
  pagination?: PaginationOptions
): Promise<ServiceResult<PaginatedResult<UserDto>>> {
  try {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase.from('users').select('*', { count: 'exact' });

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
      console.error('[UserService] Error fetching users:', error);
      return {
        data: null,
        error: new Error(`Failed to fetch users: ${error.message}`),
      };
    }

    const total = count ?? 0;
    const users = data?.map((user) => mapToUserDto(user)) ?? [];

    return {
      data: {
        data: users,
        total,
        page,
        limit,
        hasMore: to < total - 1,
      },
      error: null,
    };
  } catch (error) {
    console.error('[UserService] Unexpected error fetching users:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error occurred'),
    };
  }
}

/**
 * Sync user data from Clerk to Supabase
 * Creates user if not exists, updates if exists
 */
export async function syncUserFromClerk(
  supabase: SupabaseClient<Database>,
  options: CreateUserOptions
): Promise<ServiceResult<UserDto>> {
  try {
    // Try to get existing user
    const existingResult = await getUserById(supabase, options.id);

    // If user exists, update it
    if (existingResult.data) {
      return updateUser(supabase, options.id, {
        name: options.name,
        picture: options.picture,
        emailVerified: options.emailVerified,
      });
    }

    // If user doesn't exist, create it
    return createUser(supabase, options);
  } catch (error) {
    console.error('[UserService] Unexpected error syncing user:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error occurred'),
    };
  }
}
