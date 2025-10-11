import { useAuth, useUser } from '@clerk/clerk-react';
import { useCallback, useEffect, useRef } from 'react';

import { Alert } from '@/components/Alert';
import { LoadingBanner } from '@/components/LoadingBanner';

import { useWorkspaceService } from '@/hooks/useWorkspaceService';
import { useWorkspaceStore } from '@/stores/workspace';

// Constants
const MAX_RETRY_ATTEMPTS = 3;
const INITIAL_RETRY_DELAY = 1000;
const MAX_RETRY_DELAY = 10000;
const TOKEN_READY_DELAY = 300;
const RETRYABLE_STATUS_CODES = [0, 500, 503];

/**
 * Workspace Initialization Provider
 *
 * Ensures authenticated users can access their workspaces with proper error handling.
 * The backend automatically creates a default workspace if the user has none.
 *
 * Features:
 * - Automatic retry with exponential backoff for transient errors
 * - User-friendly error UI for persistent failures
 * - Manual retry option for users
 * - Differentiates between retryable and non-retryable errors
 * - Updates Zustand store with fetched workspaces
 *
 * Flow:
 * 1. User signs in via Clerk
 * 2. Wait for Clerk session to be ready
 * 3. Fetch user's workspaces from backend (with retry)
 * 4. Backend auto-creates "My Workspace" if user has none
 * 5. Update the Zustand store with fetched workspaces
 * 6. Store automatically sets first workspace as current if none selected
 * 7. If errors occur, show user-friendly error message with retry option
 *
 * Note: This provider does NOT sync user data to Supabase.
 * User data remains in Clerk as the single source of truth.
 */
export function WorkspaceProvider({ children }: React.PropsWithChildren) {
  // Refs
  const workspaceInitializedRef = useRef(false);
  const retryCountRef = useRef(0);

  // External Hooks
  const { user, isSignedIn, isLoaded: isUserLoaded } = useUser();
  const { isLoaded: isAuthLoaded, getToken } = useAuth();
  const workspaceService = useWorkspaceService();

  // Store
  const setWorkspaces = useWorkspaceStore((state) => state.setWorkspaces);
  const setInitializing = useWorkspaceStore((state) => state.setInitializing);
  const setInitError = useWorkspaceStore((state) => state.setInitError);
  const isInitializing = useWorkspaceStore((state) => state.isInitializing);
  const initError = useWorkspaceStore((state) => state.initError);

  // Event Handlers & Functions
  /**
   * Initialize workspace with retry logic
   */
  const initializeWorkspace = useCallback(
    async (retryDelay = 0) => {
      if (retryDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }

      setInitializing(true);

      try {
        // Ensure we have a valid token before proceeding
        const token = await getToken();
        if (!token) {
          console.error('[WorkspaceInit] No auth token available');
          setInitError({
            type: 'fetch_failed',
            message: 'Authentication token is not available. Please try signing in again.',
            retryable: true,
          });
          setInitializing(false);
          return;
        }

        console.log('[WorkspaceInit] Starting workspace initialization...');

        // Fetch user workspaces
        const workspacesResult = await workspaceService.getUserWorkspaces();

        if (workspacesResult.error) {
          const errorMessage = workspacesResult.error.message || 'Unknown error';
          const statusCode = workspacesResult.error.statusCode;

          console.error('[WorkspaceInit] Failed to fetch workspaces:', workspacesResult.error);

          // Determine if error is retryable
          const isRetryable =
            statusCode !== undefined && RETRYABLE_STATUS_CODES.includes(statusCode);

          // Retry logic: Max attempts with exponential backoff
          if (isRetryable && retryCountRef.current < MAX_RETRY_ATTEMPTS) {
            retryCountRef.current += 1;
            const nextDelay = Math.min(
              INITIAL_RETRY_DELAY * Math.pow(2, retryCountRef.current),
              MAX_RETRY_DELAY
            );

            console.log(
              `[WorkspaceInit] Retrying (${retryCountRef.current}/${MAX_RETRY_ATTEMPTS}) in ${nextDelay}ms...`
            );

            setTimeout(() => initializeWorkspace(nextDelay), nextDelay);
            return;
          }

          // Show error to user after all retries exhausted
          setInitError({
            type: 'fetch_failed',
            message:
              statusCode === 500
                ? 'Server error: Unable to fetch workspaces. This may be a database configuration issue.'
                : errorMessage,
            statusCode,
            retryable: isRetryable,
          });
          setInitializing(false);
          return;
        }

        // Reset retry count on success
        retryCountRef.current = 0;
        setInitError(null);
        setInitializing(false);

        // Update the store with fetched workspaces
        if (workspacesResult.data) {
          setWorkspaces(workspacesResult.data);
          console.log(
            `[WorkspaceInit] Workspace initialization successful. Found ${workspacesResult.data.length} workspace(s), updated store`
          );
        } else {
          console.log('[WorkspaceInit] Workspace initialization successful but no data returned');
        }
      } catch (err) {
        console.error('[WorkspaceInit] Unexpected error:', err);
        setInitError({
          type: 'server_error',
          message: 'An unexpected error occurred. Please try again.',
          retryable: true,
        });
        setInitializing(false);
      }
    },
    [getToken, workspaceService, setWorkspaces, setInitializing, setInitError]
  );

  /**
   * Manual retry handler
   */
  const handleRetry = useCallback(() => {
    retryCountRef.current = 0;
    setInitError(null);
    initializeWorkspace();
  }, [initializeWorkspace]);

  // Side Effects
  useEffect(() => {
    // Wait for both Clerk user and auth to be fully loaded
    if (!isUserLoaded || !isAuthLoaded) {
      console.log('[WorkspaceInit] Waiting for Clerk to load...');
      return;
    }

    if (!isSignedIn || !user) {
      console.log('[WorkspaceInit] User not signed in, skipping workspace initialization');
      // Reset initialization flag and store state when user signs out
      workspaceInitializedRef.current = false;
      setInitError(null);
      setInitializing(false);
      return;
    }

    const primaryEmail = user.primaryEmailAddress?.emailAddress;
    if (!primaryEmail) {
      console.warn('[WorkspaceInit] User has no primary email. Skipping workspace initialization.');
      return;
    }

    // Initialize workspace once per session
    if (!workspaceInitializedRef.current) {
      console.log('[WorkspaceInit] Initializing workspace for user:', primaryEmail);
      workspaceInitializedRef.current = true;
      // Small delay to ensure token is available
      setTimeout(() => initializeWorkspace(), TOKEN_READY_DELAY);
    }
  }, [isUserLoaded, isAuthLoaded, isSignedIn, user, initializeWorkspace]);

  // Early Returns - Error State (Blocks UI completely)
  if (initError && !isInitializing) {
    return (
      <div className="bg-background fixed inset-0 z-50 flex items-center justify-center">
        <div className="w-full max-w-2xl px-4">
          <Alert
            variant="error"
            icon="⚠️"
            title="Workspace Initialization Failed"
            message={initError.message}
            details={
              initError.statusCode === 500 ? (
                <>
                  💡 <strong>Admin action required:</strong> Please check the database RLS policies
                  configuration.
                </>
              ) : undefined
            }
            action={
              initError.retryable
                ? {
                    label: 'Retry',
                    onClick: handleRetry,
                  }
                : undefined
            }
          />
        </div>
      </div>
    );
  }

  // Early Returns - Loading State (Blocks UI completely)
  if (isInitializing) {
    return (
      <div className="bg-background fixed inset-0 z-50">
        <LoadingBanner
          message="Initializing workspace..."
          progress={
            retryCountRef.current > 0
              ? { current: retryCountRef.current + 1, total: MAX_RETRY_ATTEMPTS + 1 }
              : undefined
          }
        />
        <div className="flex h-screen items-center justify-center">
          <div className="text-muted-foreground text-center">
            <p>Please wait while we set up your workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  // Main Render - Only render children after successful initialization
  return <>{children}</>;
}
