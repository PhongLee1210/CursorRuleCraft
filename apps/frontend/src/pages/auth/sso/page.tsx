import { useEffect } from 'react';

import { AuthenticateWithRedirectCallback, useAuth, useClerk } from '@clerk/clerk-react';

export function SSOCallbackPage() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const clerk = useClerk();

  useEffect(() => {
    console.log('[SSO Callback] Component mounted');
    console.log('[SSO Callback] URL:', window.location.href);
    console.log('[SSO Callback] Search params:', window.location.search);
  }, []);

  useEffect(() => {
    console.log('[SSO Callback] Auth state:', { isLoaded, isSignedIn, userId });

    if (isLoaded) {
      console.log('[SSO Callback] Clerk loaded');
      console.log('[SSO Callback] Session:', clerk.session);
      console.log('[SSO Callback] User:', clerk.user);
    }
  }, [isLoaded, isSignedIn, userId, clerk]);

  return (
    <div className="bg-background flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="border-primary mb-4 inline-block size-12 animate-spin rounded-full border-4 border-solid border-r-transparent align-middle motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        <h2 className="text-foreground text-xl font-semibold">Completing sign-in...</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Please wait while we redirect you to your dashboard.
        </p>
      </div>

      {/* 
        Clerk's component handles the OAuth callback automatically
        It will redirect to the URL specified in ClerkProvider or signInForceRedirectUrl
      */}
      <AuthenticateWithRedirectCallback />
    </div>
  );
}
