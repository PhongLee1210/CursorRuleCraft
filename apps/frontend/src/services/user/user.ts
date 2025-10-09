/**
 * User Service
 *
 * This service provides user management operations by calling the backend API.
 * All operations are authenticated using Clerk tokens.
 */

import type { ApiClient } from '@/lib/api-client';
import type { UserDto } from '@/types/user';
import { mapToUserDto } from './mapper';
import type {
  CreateUserOptions,
  PaginatedResult,
  PaginationOptions,
  ServiceResult,
  UserQueryFilters,
} from './types';

/**
 * Create a new user via backend API
 * This is typically called after a user signs up with Clerk
 */
export async function createUser(
  apiClient: ApiClient,
  options: CreateUserOptions
): Promise<ServiceResult<UserDto>> {
  try {
    const response = await apiClient.post<{ data: any }>('/api/users', {
      id: options.id,
      name: options.name,
      email: options.email,
      username: options.username,
      picture: options.picture,
      locale: options.locale,
      emailVerified: options.emailVerified,
      provider: options.provider,
    });

    if (response.error) {
      console.error('[UserService] Error creating user:', response.error);
      return {
        data: null,
        error: response.error,
      };
    }

    return {
      data: mapToUserDto(response.data!.data),
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
  apiClient: ApiClient,
  userId: string
): Promise<ServiceResult<UserDto>> {
  try {
    const response = await apiClient.get<{ data: any }>(`/api/users/id/${userId}`);

    if (response.error) {
      console.error('[UserService] Error fetching user by ID:', response.error);
      return {
        data: null,
        error: response.error,
      };
    }

    return {
      data: mapToUserDto(response.data!.data),
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
  apiClient: ApiClient,
  email: string
): Promise<ServiceResult<UserDto>> {
  try {
    const response = await apiClient.get<{ data: any }>(`/api/users/email/${email}`);

    if (response.error) {
      console.error('[UserService] Error fetching user by email:', response.error);
      return {
        data: null,
        error: response.error,
      };
    }

    return {
      data: mapToUserDto(response.data!.data),
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
  apiClient: ApiClient,
  username: string
): Promise<ServiceResult<UserDto>> {
  try {
    const response = await apiClient.get<{ data: any }>(`/api/users/username/${username}`);

    if (response.error) {
      console.error('[UserService] Error fetching user by username:', response.error);
      return {
        data: null,
        error: response.error,
      };
    }

    return {
      data: mapToUserDto(response.data!.data),
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
  apiClient: ApiClient,
  username: string,
  excludeUserId?: string
): Promise<ServiceResult<boolean>> {
  try {
    const params = excludeUserId ? { excludeUserId } : undefined;
    const response = await apiClient.get<{ data: boolean }>(
      `/api/users/check-username/${username}`,
      { params }
    );

    if (response.error) {
      console.error('[UserService] Error checking username availability:', response.error);
      return {
        data: null,
        error: response.error,
      };
    }

    return {
      data: response.data!.data,
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
  apiClient: ApiClient,
  filters?: UserQueryFilters,
  pagination?: PaginationOptions
): Promise<ServiceResult<PaginatedResult<UserDto>>> {
  try {
    const params: Record<string, any> = {
      page: pagination?.page ?? 1,
      limit: pagination?.limit ?? 10,
    };

    if (filters?.email) params.email = filters.email;
    if (filters?.username) params.username = filters.username;
    if (filters?.provider) params.provider = filters.provider;

    const response = await apiClient.get<{
      data: any[];
      total: number;
      page: number;
      limit: number;
      hasMore: boolean;
    }>('/api/users', { params });

    if (response.error) {
      console.error('[UserService] Error fetching users:', response.error);
      return {
        data: null,
        error: response.error,
      };
    }

    const result = response.data!;
    const users = result.data.map((user) => mapToUserDto(user));

    return {
      data: {
        data: users,
        total: result.total,
        page: result.page,
        limit: result.limit,
        hasMore: result.hasMore,
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
 * Sync user data from Clerk to Supabase via backend
 * Creates user if not exists, updates if exists
 */
export async function syncUserFromClerk(
  apiClient: ApiClient,
  options: CreateUserOptions
): Promise<ServiceResult<UserDto>> {
  try {
    const response = await apiClient.post<{ data: any }>('/api/users/sync', {
      id: options.id,
      name: options.name,
      email: options.email,
      username: options.username,
      picture: options.picture,
      locale: options.locale,
      emailVerified: options.emailVerified,
      provider: options.provider,
    });

    if (response.error) {
      console.error('[UserService] Error syncing user:', response.error);
      return {
        data: null,
        error: response.error,
      };
    }

    return {
      data: mapToUserDto(response.data!.data),
      error: null,
    };
  } catch (error) {
    console.error('[UserService] Unexpected error syncing user:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error occurred'),
    };
  }
}

/**
 * Get current user's profile
 */
export async function getCurrentUser(apiClient: ApiClient): Promise<ServiceResult<UserDto>> {
  try {
    const response = await apiClient.get<{ data: any }>('/api/users/me');

    if (response.error) {
      console.error('[UserService] Error fetching current user:', response.error);
      return {
        data: null,
        error: response.error,
      };
    }

    return {
      data: mapToUserDto(response.data!.data),
      error: null,
    };
  } catch (error) {
    console.error('[UserService] Unexpected error fetching current user:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error occurred'),
    };
  }
}
