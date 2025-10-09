/**
 * Delete User Service
 */

import type { ApiClient } from '@/lib/api-client';
import type { ServiceResult } from './types';

/**
 * Delete a user via backend API
 */
export async function deleteUser(
  apiClient: ApiClient,
  userId: string
): Promise<ServiceResult<boolean>> {
  try {
    const response = await apiClient.delete<{ data: boolean }>('/api/users/me');

    if (response.error) {
      console.error('[UserService] Error deleting user:', response.error);
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
    console.error('[UserService] Unexpected error deleting user:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error occurred'),
    };
  }
}
