import { useUser } from '@clerk/clerk-react';
import { useEffect } from 'react';
import { useDebounceValue } from 'usehooks-ts';
import { useUserService } from './useUserService';

/**
 * Hook to synchronize the Clerk user data with the Supabase database.
 * It observes the user session and triggers a sync when the user is signed in.
 * A debounce is used to prevent excessive API calls.
 */
export function useUserSync() {
  const { user, isSignedIn } = useUser();
  const userService = useUserService();
  const [debouncedUser] = useDebounceValue(user, 1000);

  useEffect(() => {
    if (isSignedIn && debouncedUser) {
      const primaryEmail = debouncedUser.primaryEmailAddress?.emailAddress;
      if (!primaryEmail) {
        console.warn('User has no primary email address. Skipping sync.');
        return;
      }

      userService.syncUserFromClerk({
        id: debouncedUser.id,
        email: primaryEmail,
        name:
          debouncedUser.fullName || `${debouncedUser.firstName} ${debouncedUser.lastName}`.trim(),
        username: debouncedUser.username || primaryEmail.split('@')[0],
        picture: debouncedUser.imageUrl,
        emailVerified: debouncedUser.primaryEmailAddress?.verification.status === 'verified',
      });
    }
  }, [debouncedUser, isSignedIn, userService]);
}
