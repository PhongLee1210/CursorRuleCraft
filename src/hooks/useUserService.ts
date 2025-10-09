/**
 * useUserService Hook
 * Provides access to user service operations with Supabase
 */

import { useSupabaseClient } from '@/lib/supabase';
import { createUserService } from '@/services/user';
import { type Database } from '@/types/database';
import { type SupabaseClient } from '@supabase/supabase-js';
import { useMemo } from 'react';

/**
 * Hook that provides a UserService instance
 * Automatically uses the authenticated Supabase client
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
  const supabase = useSupabaseClient();

  const userService = useMemo(() => {
    return createUserService(supabase as SupabaseClient<Database>);
  }, [supabase]);

  return userService;
}
