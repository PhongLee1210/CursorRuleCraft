/**
 * useUserService Hook
 * Provides access to user service operations via backend API
 */

import { useApiClient } from '@/lib/api-client';
import { createUserService } from '@/services/user';
import { useMemo } from 'react';

/**
 * Hook that provides a UserService instance
 * Automatically uses the authenticated API client to communicate with the backend
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const userService = useUserService();
 *
 *   const handleCreateUser = async () => {
 *     const { data, error } = await userService.createUser({
 *       id: 'clerk-user-id',
 *       name: 'John Doe',
 *       email: 'john@example.com',
 *       username: 'johndoe',
 *     });
 *
 *     if (error) {
 *       console.error('Failed to create user:', error);
 *       return;
 *     }
 *
 *     console.log('User created:', data);
 *   };
 * }
 * ```
 */
export function useUserService() {
  const apiClient = useApiClient();

  const userService = useMemo(() => {
    return createUserService(apiClient);
  }, [apiClient]);

  return userService;
}
