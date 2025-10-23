import { useAuth, useClerk, useUser } from '@clerk/clerk-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { Alert } from '@/components/Alert';
import { LoadingBanner } from '@/components/LoadingBanner';

import { useWorkspaceService } from '@/hooks/useWorkspaceService';
import { useLocalStorage } from '@/lib/useLocalStorage';
import { useWorkspaceStore } from '@/stores/workspace';
import type { Workspace } from '@/types/workspace';

// Constants
const TOKEN_READY_DELAY = 300;
const REDIRECT_DELAY = 3000; // Delay before redirecting to login page
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
 * Workspace Provider
 *
 * Manages workspace state for authenticated users.
 * Workspaces are automatically created via Clerk webhooks when users sign up.
 *
 * Features:
 * - Fetches workspaces that should already exist (created by webhook)
 * - Updates Zustand store with workspace data
 * - Caches workspace data in localStorage to avoid unnecessary API calls
 * - Cache invalidation based on user and time (5-minute expiry)
 * - Graceful error handling with user-friendly messages
 *
 * Flow:
 * 1. User signs in via Clerk (workspace already created by webhook)
 * 2. Wait for Clerk session to be ready
 * 3. Check localStorage cache for valid workspace data (user + time check)
 * 4. If cache valid: Use cached data immediately, update Zustand store
 * 5. If cache invalid/missing: Fetch workspaces from backend
 * 6. Update Zustand store and localStorage cache with fetched data
 * 7. Store automatically sets first workspace as current if none selected
 * 8. If errors occur, show user-friendly error message
 *
 * Note: This provider does NOT create workspaces - that's handled by webhooks.
 * User data remains in Clerk as the single source of truth.
 */
export function WorkspaceProvider({ children }: React.PropsWithChildren) {
  // Refs
  const workspaceInitializedRef = useRef(false);

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
        console.log('[WorkspaceProvider] Loading workspaces from cache');
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
      console.log('[WorkspaceProvider] Saved workspaces to cache');
    },
    [setCachedWorkspaceData]
  );

  /**
   * Clear workspace cache (useful for sign out)
   */
  const clearCache = useCallback(() => {
    setCachedWorkspaceData(null);
    console.log('[WorkspaceProvider] Cleared workspace cache');
  }, [setCachedWorkspaceData]);

  /**
   * Sign out and redirect to login page with saved location
   */
  const clearAuthAndRedirect = useCallback(async () => {
    try {
      setIsClearingAuth(true);
      console.log(
        '[WorkspaceProvider] Signing out and redirecting to login with saved location...'
      );

      // Clear workspace cache before signing out
      clearCache();

      await signOut();

      // Navigate to login page with saved location state (same pattern as AuthGuard)
      navigate('/auth/login', {
        replace: true,
        state: { from: location },
      });
    } catch (err) {
      console.error('[WorkspaceProvider] Error during sign out:', err);
      navigate('/auth/login', { replace: true });
    } finally {
      setIsClearingAuth(false);
    }
  }, [navigate, location, clearCache]);

  /**
   * Initialize workspace - fetch workspaces that should already exist
   */
  const initializeWorkspace = useCallback(async () => {
    setInitializing(true);

    try {
      // Ensure we have a valid token before proceeding
      const token = await getToken();
      if (!token) {
        console.error('[WorkspaceProvider] No auth token available');
        setInitError({
          type: 'fetch_failed',
          message: 'Authentication token is not available. Please try signing in again.',
          retryable: false,
        });
        setInitializing(false);
        return;
      }

      const primaryEmail = user?.primaryEmailAddress?.emailAddress;
      if (!primaryEmail) {
        console.error('[WorkspaceProvider] No primary email available');
        setInitError({
          type: 'fetch_failed',
          message: 'User email is not available. Please try signing in again.',
          retryable: false,
        });
        setInitializing(false);
        return;
      }

      console.log('[WorkspaceProvider] Starting workspace initialization...');

      // Try to load from cache first
      const cachedWorkspaces = loadFromCache(primaryEmail);
      if (cachedWorkspaces) {
        console.log('[WorkspaceProvider] Using cached workspaces, updating store...');
        setWorkspaces(cachedWorkspaces);
        setInitializing(false);
        return;
      }

      console.log('[WorkspaceProvider] Cache miss or invalid, fetching from server...');

      // Fetch user workspaces from server (should already exist via webhook)
      const workspacesResult = await workspaceService.getUserWorkspaces();

      if (workspacesResult.error) {
        const errorMessage = workspacesResult.error.message || 'Unknown error';
        const statusCode = workspacesResult.error.statusCode;

        console.error('[WorkspaceProvider] Failed to fetch workspaces:', workspacesResult.error);

        // Show error to user - no retry logic since workspaces should exist
        setInitError({
          type: 'fetch_failed',
          message:
            statusCode === 500
              ? 'Server error: Unable to fetch workspaces. Workspaces are created automatically via webhooks when you sign up.'
              : errorMessage,
          statusCode,
          retryable: false,
        });
        setInitializing(false);

        // Sign out and redirect after a delay
        console.log(`[WorkspaceProvider] Error occurred. Signing out in ${REDIRECT_DELAY}ms...`);
        setTimeout(() => clearAuthAndRedirect(), REDIRECT_DELAY);
        return;
      }

      setInitError(null);
      setInitializing(false);

      // Update the store with fetched workspaces and save to cache
      if (workspacesResult.data) {
        setWorkspaces(workspacesResult.data);
        saveToCache(workspacesResult.data, primaryEmail);
        console.log(
          `[WorkspaceProvider] Workspace initialization successful. Found ${workspacesResult.data.length} workspace(s), updated store and cache`
        );
      } else {
        console.log('[WorkspaceProvider] No workspaces found - this may be a new user');
        setWorkspaces([]);
      }
    } catch (err) {
      console.error('[WorkspaceProvider] Unexpected error:', err);
      setInitError({
        type: 'server_error',
        message: 'An unexpected error occurred. Please try again.',
        retryable: false,
      });
      setInitializing(false);

      // Sign out and redirect after a delay for unexpected errors
      console.log(
        `[WorkspaceProvider] Unexpected error occurred. Signing out in ${REDIRECT_DELAY}ms...`
      );
      setTimeout(() => clearAuthAndRedirect(), REDIRECT_DELAY);
    }
  }, [
    getToken,
    user,
    workspaceService,
    setWorkspaces,
    setInitializing,
    setInitError,
    loadFromCache,
    saveToCache,
    clearAuthAndRedirect,
  ]);

  // Side Effects
  useEffect(() => {
    // Wait for both Clerk user and auth to be fully loaded
    if (!isUserLoaded || !isAuthLoaded) {
      console.log('[WorkspaceProvider] Waiting for Clerk to load...');
      return;
    }

    if (!isSignedIn || !user) {
      console.log('[WorkspaceProvider] User not signed in, skipping workspace initialization');
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
      console.warn(
        '[WorkspaceProvider] User has no primary email. Skipping workspace initialization.'
      );
      return;
    }

    // Initialize workspace once per session
    if (!workspaceInitializedRef.current) {
      console.log('[WorkspaceProvider] Initializing workspace for user:', primaryEmail);
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
            title="Unable to Load Workspaces"
            message={initError.message}
            details={
              <>
                {initError.statusCode === 500 && (
                  <>
                    💡 <strong>Tip:</strong> Workspaces are created automatically via webhooks when
                    you sign up. If you just signed up, try refreshing the page.
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
        <LoadingBanner message="Loading workspaces..." />
        <div className="flex h-screen items-center justify-center">
          <div className="text-muted-foreground text-center">
            <p>Please wait while we load your workspaces...</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
