import { useState } from 'react';

import { useSignIn, useSignUp } from '@clerk/clerk-react';
import type { OAuthStrategy } from '@clerk/types';
import { t } from '@lingui/macro';
import { CircleNotch } from '@phosphor-icons/react';

import { Button } from '@frontend/components/Button';
import { useAuthProviders, type OAuthProvider } from '@frontend/hooks/useAuthProviders';

export const SocialAuth = () => {
  const { providers, hasOAuthProviders } = useAuthProviders();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  // Don't render if no OAuth providers are enabled
  if (!hasOAuthProviders) return null;

  /**
   * Handle OAuth sign-in/sign-up with redirect
   * Uses Clerk's authenticateWithRedirect method for OAuth flow
   * This method handles both existing users (sign-in) and new users (sign-up)
   */
  const handleOAuthSignIn = async (provider: OAuthProvider) => {
    // Prefer signUp for OAuth as it handles both sign-in and sign-up
    const authMethod = signUp || signIn;

    if (!authMethod) {
      console.error('[OAuth] Neither SignIn nor SignUp available');
      return;
    }

    try {
      setIsLoading(provider);
      console.log(`[OAuth] Starting ${provider} authentication...`);
      console.log('[OAuth] Using auth method:', signUp ? 'signUp' : 'signIn');

      // Map provider to Clerk OAuth strategy
      const strategy: OAuthStrategy = `oauth_${provider}` as OAuthStrategy;

      // Use signUp.authenticateWithRedirect if available (handles both sign-in and sign-up)
      // Otherwise fall back to signIn.authenticateWithRedirect
      await authMethod.authenticateWithRedirect({
        strategy,
        // Let ClerkProvider settings handle redirects
        // This prevents the #/continue fragment issue
        redirectUrl: `${window.location.origin}/auth/callback`,
        redirectUrlComplete: `${window.location.origin}/dashboard`,
      });

      console.log(`[OAuth] Redirect initiated for ${provider}`);
    } catch (error: any) {
      console.error(`[OAuth] Error with ${provider} authentication:`, error);

      // Handle specific Clerk errors
      if (error?.errors) {
        const clerkErrors = error.errors;
        console.error('[OAuth] Clerk errors:', clerkErrors);

        // Check for account transfer error
        const hasTransferError = clerkErrors.some(
          (err: any) => err.code === 'account_transfer_invalid'
        );

        if (hasTransferError) {
          console.error(
            '[OAuth] Account transfer invalid - This means username/password are still required. ' +
              'Go to Clerk Dashboard → User & Authentication → Email, Phone, Username and ' +
              'disable or make Username optional.'
          );
        }
      }

      setIsLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {providers.includes('google') && (
        <Button
          size="lg"
          className="group relative w-full overflow-hidden !bg-white !text-[#3c4043] shadow-sm ring-1 ring-gray-200 transition-all duration-200 hover:!bg-gray-50 hover:shadow-md disabled:!bg-gray-100 disabled:!text-gray-400"
          onClick={() => handleOAuthSignIn('google')}
          disabled={isLoading !== null}
          aria-label={t`Sign in with Google`}
        >
          {isLoading === 'google' ? (
            <CircleNotch className="mr-2 size-5 animate-spin" weight="bold" />
          ) : (
            <img src="/social/google-dark.svg" alt="Google" className="mr-2 size-5" />
          )}
          <span className="font-medium">
            {isLoading === 'google' ? t`Connecting...` : t`Google`}
          </span>
        </Button>
      )}

      {providers.includes('github') && (
        <Button
          size="lg"
          className="group relative w-full overflow-hidden !bg-[#24292e] !text-white shadow-sm transition-all duration-200 hover:!bg-[#2f363d] hover:shadow-md disabled:!bg-gray-700 disabled:!text-gray-400"
          onClick={() => handleOAuthSignIn('github')}
          disabled={isLoading !== null}
          aria-label={t`Sign in with GitHub`}
        >
          {isLoading === 'github' ? (
            <CircleNotch className="mr-2 size-5 animate-spin" weight="bold" />
          ) : (
            <img src="/social/github-mark-white.svg" alt="GitHub" className="mr-2 size-5" />
          )}
          <span className="font-medium">
            {isLoading === 'github' ? t`Connecting...` : t`GitHub`}
          </span>
        </Button>
      )}
    </div>
  );
};
