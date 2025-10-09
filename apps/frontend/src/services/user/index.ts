/**
 * User Service Factory
 *
 * Creates a user service that uses the backend API instead of direct Supabase access.
 */

import type { ApiClient } from '@/lib/api-client';
import { deleteUser } from './delete-user';
import { updateUser } from './update-user';
import {
  createUser,
  getCurrentUser,
  getUserByEmail,
  getUserById,
  getUserByUsername,
  getUsers,
  isUsernameAvailable,
  syncUserFromClerk,
} from './user';

export function createUserService(apiClient: ApiClient) {
  return {
    createUser: createUser.bind(null, apiClient),
    deleteUser: deleteUser.bind(null, apiClient),
    getCurrentUser: getCurrentUser.bind(null, apiClient),
    getUserByEmail: getUserByEmail.bind(null, apiClient),
    getUserById: getUserById.bind(null, apiClient),
    getUserByUsername: getUserByUsername.bind(null, apiClient),
    getUsers: getUsers.bind(null, apiClient),
    isUsernameAvailable: isUsernameAvailable.bind(null, apiClient),
    syncUserFromClerk: syncUserFromClerk.bind(null, apiClient),
    updateUser: updateUser.bind(null, apiClient),
  };
}

export type UserService = ReturnType<typeof createUserService>;

// Re-export types and utilities
export { mapToUserDto } from './mapper';
export * from './types';
