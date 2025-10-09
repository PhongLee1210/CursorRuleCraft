import { useUserService } from '@/hooks/useUserService';
import { useWorkspaceService } from '@/hooks/useWorkspaceService';
import { useUser } from '@clerk/clerk-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { useDebounceValue } from 'usehooks-ts';

interface AuthSyncProviderProps {
  children: ReactNode;
}

export function AuthSyncProvider({ children }: AuthSyncProviderProps) {
  const { user, isSignedIn } = useUser();
  const userService = useUserService();
  const workspaceService = useWorkspaceService();
  const [debouncedUser] = useDebounceValue(user, 1000);
  const workspaceInitializedRef = useRef(false);

  useEffect(() => {
    if (isSignedIn && debouncedUser) {
      const primaryEmail = debouncedUser.primaryEmailAddress?.emailAddress;
      if (!primaryEmail) {
        console.warn('[AuthSync] User has no primary email address. Skipping sync.');
        return;
      }

      // Sync user data and initialize workspace
      (async () => {
        // Step 1: Sync user profile from Clerk to Supabase
        const syncResult = await userService.syncUserFromClerk({
          id: debouncedUser.id,
          email: primaryEmail,
          name:
            debouncedUser.fullName || `${debouncedUser.firstName} ${debouncedUser.lastName}`.trim(),
          username: debouncedUser.username || primaryEmail.split('@')[0],
          picture: debouncedUser.imageUrl,
          emailVerified: debouncedUser.primaryEmailAddress?.verification.status === 'verified',
        });

        if (syncResult.error) {
          console.error('[AuthSync] Failed to sync user:', syncResult.error);
          return;
        }

        // Step 2: Initialize default workspace for new users (once per session)
        if (!workspaceInitializedRef.current) {
          workspaceInitializedRef.current = true;

          // Check if user already has workspaces
          const workspacesResult = await workspaceService.getUserWorkspaces();

          if (workspacesResult.error) {
            console.error('[AuthSync] Failed to fetch workspaces:', workspacesResult.error);
            return;
          }

          // If user has no workspaces, create a default one with OWNER role
          if (workspacesResult.data && workspacesResult.data.length === 0) {
            const userName = syncResult.data?.name || 'My';
            const defaultWorkspaceName = `${userName}'s Workspace`;

            const createResult = await workspaceService.createWorkspace({
              name: defaultWorkspaceName,
            });

            if (createResult.error) {
              console.error('[AuthSync] Failed to create default workspace:', createResult.error);
            } else {
              console.log('[AuthSync] Default workspace created:', createResult.data);
            }
          }
        }
      })();
    }
  }, [debouncedUser, isSignedIn, userService, workspaceService]);

  // This is a logical component - just render children
  return <>{children}</>;
}
