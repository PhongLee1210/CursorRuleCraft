import type { Database } from '@/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';
import { deleteUser } from './delete-user';
import { updateUser } from './update-user';
import {
  createUser,
  getUserByEmail,
  getUserById,
  getUserByUsername,
  getUsers,
  isUsernameAvailable,
  syncUserFromClerk,
} from './user';

export function createUserService(supabase: SupabaseClient<Database>) {
  return {
    createUser: createUser.bind(null, supabase),
    deleteUser: deleteUser.bind(null, supabase),
    getUserByEmail: getUserByEmail.bind(null, supabase),
    getUserById: getUserById.bind(null, supabase),
    getUserByUsername: getUserByUsername.bind(null, supabase),
    getUsers: getUsers.bind(null, supabase),
    isUsernameAvailable: isUsernameAvailable.bind(null, supabase),
    syncUserFromClerk: syncUserFromClerk.bind(null, supabase),
    updateUser: updateUser.bind(null, supabase),
  };
}

export type UserService = ReturnType<typeof createUserService>;
