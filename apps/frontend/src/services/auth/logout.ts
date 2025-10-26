import { useCallback } from 'react';

import { useClerk } from '@clerk/clerk-react';

/**
 * Hook for handling user logout.
 *
 * @returns An object with a `logout` function.
 * @example
 * const { logout } = useLogout();
 * logout({ redirectUrl: '/login' });
 */
export function useLogout() {
  const { signOut } = useClerk();

  const logout = useCallback(
    async (options?: { redirectUrl?: string }) => {
      try {
        await signOut({ redirectUrl: options?.redirectUrl || '/' });
      } catch (error) {
        console.error('Error during logout:', error);
      }
    },
    [signOut]
  );

  return { logout };
}
