import type { Database } from '@/types/database';
import type { UserDto } from '@/types/user';
import type { SupabaseClient } from '@supabase/supabase-js';
import { mapToUserDto } from './mapper';
import type { ServiceResult, UpdateUserOptions } from './types';

/**
 * Update a user's information
 */
export async function updateUser(
  supabase: SupabaseClient<Database>,
  userId: string,
  updates: UpdateUserOptions
): Promise<ServiceResult<UserDto>> {
  try {
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

    const { data, error } = await (supabase.from('users') as any)
      .update(userUpdate)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('[UserService] Error updating user:', error);
      return {
        data: null,
        error: new Error(`Failed to update user: ${error.message}`),
      };
    }

    return {
      data: mapToUserDto(data),
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
