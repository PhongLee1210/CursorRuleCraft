import { useWorkspaceStore } from '@frontend/stores/workspace';
import { useClerk } from '@clerk/clerk-react';
import { useCallback, useState } from 'react';

type UseLogoutOutput = {
  logout: () => Promise<void>;
  isLoading: boolean;
};

/**
 * Custom hook to handle user logout with Clerk.
 *
 * This hook:
 * - Signs out the user from Clerk
 * - Resets the workspace store
 * - Handles any errors that occur during logout
 *
 * **Navigation:** This hook does not handle navigation. If the user is on a protected route,
 * the `AuthGuard` will automatically redirect them to the login page after logout.
 * For public pages, the UI will update reactively based on Clerk's auth state.
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
  const resetWorkspace = useWorkspaceStore((state) => state.reset);
  const [isLoading, setIsLoading] = useState(false);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);

      // Reset workspace store before signing out
      resetWorkspace();

      await signOut();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setIsLoading(false);
    }
  }, [signOut, resetWorkspace]);

  return {
    logout,
    isLoading,
  };
};
