/**
 * SSO Callback Page
 * Handles the OAuth redirect callback from Clerk authentication
 */

import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import { useEffect } from 'react';

export function SSOCallbackPage() {
  useEffect(() => {
    // Optional: Add loading analytics or tracking
    console.log('[Auth] Processing OAuth callback...');
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mb-4 inline-block size-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-middle motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        <h2 className="text-xl font-semibold text-foreground">Completing sign-in...</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Please wait while we redirect you to your dashboard.
        </p>
      </div>

      {/* Clerk's component handles the OAuth callback */}
      <AuthenticateWithRedirectCallback />
    </div>
  );
}
