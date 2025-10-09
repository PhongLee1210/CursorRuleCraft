import { useUser } from '@clerk/clerk-react';
import { useState } from 'react';

/**
 * Options for updating a user's password.
 */
export interface UpdatePasswordOptions {
  newPassword: string;
  currentPassword?: string;
  signOutOfOtherSessions: boolean;
}

/**
 * Hook for updating the current user's password.
 *
 * @returns An object with `updatePassword` function, `isUpdating` state, and `error` state.
 */
export function useUpdatePassword() {
  const { user } = useUser();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updatePassword = async (options: UpdatePasswordOptions) => {
    if (!user) {
      const err = new Error('User not authenticated');
      setError(err);
      return { success: false, error: err };
    }

    setIsUpdating(true);
    setError(null);

    try {
      await user.updatePassword({
        newPassword: options.newPassword,
        currentPassword: options.currentPassword,
        signOutOfOtherSessions: options.signOutOfOtherSessions,
      });
      setIsUpdating(false);
      return { success: true, error: null };
    } catch (err: any) {
      console.error('Error updating password:', err);
      const newError = new Error(err.errors?.[0]?.message || 'Failed to update password');
      setError(newError);
      setIsUpdating(false);
      return { success: false, error: newError };
    }
  };

  return { updatePassword, isUpdating, error };
}
