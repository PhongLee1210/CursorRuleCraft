import { useAuthStore } from '@/stores/auth';
import { useClerk } from '@clerk/clerk-react';
import { useCallback, useState } from 'react';

type UseLogoutOutput = {
  logout: () => Promise<void>;
  isLoading: boolean;
};

/**
 * Custom hook to handle user logout with both Clerk and Supabase integration.
 *
 * This hook:
 * - Signs out the user from Clerk
 * - Clears the user state from the Zustand auth store
 * - Handles any errors that occur during logout
 *
 * **Navigation:** This hook does not handle navigation. If the user is on a protected route,
 * the `AuthGuard` will automatically redirect them to the login page after logout.
 * For public pages, the UI will update reactively based on the auth state.
 *
 * @returns Object containing logout function and loading state
 *
 * @example
 * ```tsx
 * function LogoutButton() {
 *   const { logout, isLoading } = useLogout();
 *
 *   return (
 *     <button onClick={logout} disabled={isLoading}>
 *       {isLoading ? 'Logging out...' : 'Logout'}
 *     </button>
 *   );
 * }
 * ```
 */
export const useLogout = (): UseLogoutOutput => {
  const { signOut } = useClerk();
  const setUser = useAuthStore((state) => state.setUser);
  const [isLoading, setIsLoading] = useState(false);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);

      // Clear user state from Zustand store
      setUser(null);

      // Sign out from Clerk
      // AuthGuard will handle redirect if user is on a protected route
      await signOut();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setIsLoading(false);
    }
  }, [signOut, setUser]);

  return {
    logout,
    isLoading,
  };
};
