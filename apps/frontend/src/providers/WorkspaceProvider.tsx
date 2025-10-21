import { useAuth, useClerk, useUser } from '@clerk/clerk-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { Alert } from '@/components/Alert';
import { LoadingBanner } from '@/components/LoadingBanner';

import { useWorkspaceService } from '@/hooks/useWorkspaceService';
import { useWorkspaceStore } from '@/stores/workspace';
import type { Workspace } from '@/types/workspace';
import { useLocalStorage } from 'usehooks-ts';

// Constants
const MAX_RETRY_ATTEMPTS = 3;
const INITIAL_RETRY_DELAY = 1000;
const MAX_RETRY_DELAY = 10000;
const TOKEN_READY_DELAY = 300;
const REDIRECT_DELAY = 3000; // Delay before redirecting to login page
const RETRYABLE_STATUS_CODES = [0, 500, 503];
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Cached workspace data structure
 */
interface CachedWorkspaceData {
  workspaces: Workspace[];
  timestamp: number;
  userId: string;
}

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
 * - Caches workspace data in localStorage to avoid unnecessary API calls
 * - Cache invalidation based on user and time (5-minute expiry)
 *
 * Flow:
 * 1. User signs in via Clerk
 * 2. Wait for Clerk session to be ready
 * 3. Check localStorage cache for valid workspace data (user + time check)
 * 4. If cache valid: Use cached data immediately, update Zustand store
 * 5. If cache invalid/missing: Fetch from backend (with retry)
 * 6. Backend auto-creates "My Workspace" if user has none
 * 7. Update Zustand store and localStorage cache with fetched data
 * 8. Store automatically sets first workspace as current if none selected
 * 9. If errors occur, show user-friendly error message with retry option
 *
 * Note: This provider does NOT sync user data to Supabase.
 * User data remains in Clerk as the single source of truth.
 */
export function WorkspaceProvider({ children }: React.PropsWithChildren) {
  // Refs
  const workspaceInitializedRef = useRef(false);
  const retryCountRef = useRef(0);

  // State
  const [isClearingAuth, setIsClearingAuth] = useState(false);

  // Local Storage for workspace cache
  const [cachedWorkspaceData, setCachedWorkspaceData] = useLocalStorage<CachedWorkspaceData | null>(
    'workspace-cache',
    null
  );

  // External Hooks
  const { user, isSignedIn, isLoaded: isUserLoaded } = useUser();
  const { isLoaded: isAuthLoaded, getToken } = useAuth();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const location = useLocation();
  const workspaceService = useWorkspaceService();

  // Store
  const setWorkspaces = useWorkspaceStore((state) => state.setWorkspaces);
  const setInitializing = useWorkspaceStore((state) => state.setInitializing);
  const setInitError = useWorkspaceStore((state) => state.setInitError);
  const isInitializing = useWorkspaceStore((state) => state.isInitializing);
  const initError = useWorkspaceStore((state) => state.initError);

  // Event Handlers & Functions
  /**
   * Check if cached data is valid for the current user and not expired
   */
  const isCacheValid = useCallback((cache: CachedWorkspaceData | null, userId: string): boolean => {
    if (!cache) return false;
    if (cache.userId !== userId) return false;
    if (Date.now() - cache.timestamp > CACHE_DURATION) return false;
    return true;
  }, []);

  /**
   * Load workspaces from cache if valid
   */
  const loadFromCache = useCallback(
    (userId: string): Workspace[] | null => {
      if (isCacheValid(cachedWorkspaceData, userId) && cachedWorkspaceData) {
        console.log('[WorkspaceInit] Loading workspaces from cache');
        return cachedWorkspaceData.workspaces;
      }
      return null;
    },
    [cachedWorkspaceData, isCacheValid]
  );

  /**
   * Save workspaces to cache
   */
  const saveToCache = useCallback(
    (workspaces: Workspace[], userId: string) => {
      const cacheData: CachedWorkspaceData = {
        workspaces,
        timestamp: Date.now(),
        userId,
      };
      setCachedWorkspaceData(cacheData);
      console.log('[WorkspaceInit] Saved workspaces to cache');
    },
    [setCachedWorkspaceData]
  );

  /**
   * Clear workspace cache (useful for sign out)
   */
  const clearCache = useCallback(() => {
    setCachedWorkspaceData(null);
    console.log('[WorkspaceInit] Cleared workspace cache');
  }, [setCachedWorkspaceData]);

  /**
   * Sign out and redirect to login page with saved location
   */
  const clearAuthAndRedirect = useCallback(async () => {
    try {
      setIsClearingAuth(true);
      console.log('[WorkspaceInit] Signing out and redirecting to login with saved location...');

      // Clear workspace cache before signing out
      clearCache();

      await signOut();

      // Navigate to login page with saved location state (same pattern as AuthGuard)
      navigate('/auth/login', {
        replace: true,
        state: { from: location },
      });
    } catch (err) {
      console.error('[WorkspaceInit] Error during sign out:', err);
      navigate('/auth/login', { replace: true });
    } finally {
      setIsClearingAuth(false);
    }
  }, [navigate, location, clearCache]);

  /**
   * Initialize workspace with retry logic and localStorage caching
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

        const primaryEmail = user?.primaryEmailAddress?.emailAddress;
        if (!primaryEmail) {
          console.error('[WorkspaceInit] No primary email available');
          setInitError({
            type: 'fetch_failed',
            message: 'User email is not available. Please try signing in again.',
            retryable: true,
          });
          setInitializing(false);
          return;
        }

        console.log('[WorkspaceInit] Starting workspace initialization...');

        // Try to load from cache first
        const cachedWorkspaces = loadFromCache(primaryEmail);
        if (cachedWorkspaces) {
          console.log('[WorkspaceInit] Using cached workspaces, updating store...');
          setWorkspaces(cachedWorkspaces);
          setInitializing(false);
          return;
        }

        console.log('[WorkspaceInit] Cache miss or invalid, fetching from server...');

        // Fetch user workspaces from server
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

          // Sign out and redirect after a delay
          console.log(
            `[WorkspaceInit] All retries exhausted. Signing out in ${REDIRECT_DELAY}ms...`
          );
          setTimeout(() => clearAuthAndRedirect(), REDIRECT_DELAY);
          return;
        }

        // Reset retry count on success
        retryCountRef.current = 0;
        setInitError(null);
        setInitializing(false);

        // Update the store with fetched workspaces and save to cache
        if (workspacesResult.data) {
          setWorkspaces(workspacesResult.data);
          saveToCache(workspacesResult.data, primaryEmail);
          console.log(
            `[WorkspaceInit] Workspace initialization successful. Found ${workspacesResult.data.length} workspace(s), updated store and cache`
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

        // Sign out and redirect after a delay for unexpected errors
        console.log(
          `[WorkspaceInit] Unexpected error occurred. Signing out in ${REDIRECT_DELAY}ms...`
        );
        setTimeout(() => clearAuthAndRedirect(), REDIRECT_DELAY);
      }
    },
    [
      getToken,
      user,
      workspaceService,
      setWorkspaces,
      setInitializing,
      setInitError,
      loadFromCache,
      saveToCache,
      clearAuthAndRedirect,
    ]
  );

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
      // Clear cache when user signs out
      clearCache();
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
  }, [isUserLoaded, isAuthLoaded, isSignedIn, user, initializeWorkspace, clearCache]);

  // Early Returns - Error State (Blocks UI completely)
  if (initError && !isInitializing) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="w-full max-w-2xl px-4">
          <Alert
            variant="error"
            icon="⚠️"
            title="Workspace Initialization Failed"
            message={initError.message}
            details={
              <>
                {initError.statusCode === 500 && (
                  <>
                    💡 <strong>Admin action required:</strong> Please check the database RLS
                    policies configuration.
                    <br />
                  </>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <svg
                    className="text-primary size-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>
                    Redirecting to login page in a moment. You can return here after signing back
                    in...
                  </span>
                </div>
              </>
            }
          />
        </div>
      </div>
    );
  }

  // Early Returns - Signing Out State (Blocks UI completely)
  if (isClearingAuth) {
    return (
      <div className="fixed inset-0 z-50">
        <LoadingBanner message="Signing you out..." />
        <div className="flex h-screen items-center justify-center">
          <div className="text-muted-foreground text-center">
            <p>Redirecting to login page...</p>
          </div>
        </div>
      </div>
    );
  }

  // Early Returns - Loading State (Blocks UI completely)
  if (isInitializing) {
    return (
      <div className="fixed inset-0 z-50">
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

  return <>{children}</>;
}
