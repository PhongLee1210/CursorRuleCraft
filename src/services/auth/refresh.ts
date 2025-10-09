import { useAuth, useUser } from '@clerk/clerk-react';
import { useCallback, useState } from 'react';

/**
 * Hook to refresh the user and session data from Clerk.
 *
 * @returns An object with `refreshSession` function and `isRefreshing` state.
 */
export function useRefreshSession() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { isLoaded: isAuthLoaded } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshSession = useCallback(async () => {
    if (!isUserLoaded || !isAuthLoaded) {
      return;
    }

    setIsRefreshing(true);
    try {
      if (user) {
        await user.reload();
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [user, isUserLoaded, isAuthLoaded]);

  return { refreshSession, isRefreshing };
}
