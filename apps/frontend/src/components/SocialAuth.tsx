import { Button } from '@/components/Button';
import { useSignIn } from '@clerk/clerk-react';
import type { OAuthStrategy } from '@clerk/types';
import { t } from '@lingui/macro';
import { CircleNotch } from '@phosphor-icons/react';
import { useState } from 'react';

import { useAuthProviders, type OAuthProvider } from '@/hooks/useAuthProviders';

export const SocialAuth = () => {
  const { providers, hasOAuthProviders } = useAuthProviders();
  const { signIn } = useSignIn();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  // Don't render if no OAuth providers are enabled
  if (!hasOAuthProviders) return null;

  /**
   * Handle OAuth sign-in with redirect
   * Uses Clerk's authenticateWithRedirect method for OAuth flow
   */
  const handleOAuthSignIn = async (provider: OAuthProvider) => {
    if (!signIn) return;

    try {
      setIsLoading(provider);

      // Map provider to Clerk OAuth strategy
      const strategy: OAuthStrategy = `oauth_${provider}` as OAuthStrategy;

      // Initiate OAuth flow with redirect
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: '/auth/callback',
        redirectUrlComplete: '/dashboard',
      });
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error);
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
