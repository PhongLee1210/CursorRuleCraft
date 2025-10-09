import type { Database } from '@/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ServiceResult } from './types';

/**
 * Delete a user
 */
export async function deleteUser(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<ServiceResult<boolean>> {
  try {
    const { error } = await supabase.from('users').delete().eq('id', userId);

    if (error) {
      console.error('[UserService] Error deleting user:', error);
      return {
        data: null,
        error: new Error(`Failed to delete user: ${error.message}`),
      };
    }

    return {
      data: true,
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
