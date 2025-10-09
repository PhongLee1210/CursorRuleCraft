/**
 * Update User Service
 */

import type { ApiClient } from '@/lib/api-client';
import type { UserDto } from '@/types/user';
import { mapToUserDto } from './mapper';
import type { ServiceResult, UpdateUserOptions } from './types';

/**
 * Update a user's information via backend API
 */
export async function updateUser(
  apiClient: ApiClient,
  userId: string,
  updates: UpdateUserOptions
): Promise<ServiceResult<UserDto>> {
  try {
    const response = await apiClient.put<{ data: any }>('/api/users/me', updates);

    if (response.error) {
      console.error('[UserService] Error updating user:', response.error);
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
    console.error('[UserService] Unexpected error updating user:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error occurred'),
    };
  }
}
