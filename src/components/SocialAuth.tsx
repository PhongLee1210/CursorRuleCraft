import { Button } from '@/components/Button';
import { useSignIn } from '@clerk/clerk-react';
import type { OAuthStrategy } from '@clerk/types';
import { t } from '@lingui/macro';
import { GithubLogoIcon, GoogleLogoIcon } from '@phosphor-icons/react';
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
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/dashboard',
      });
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error);
      setIsLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {providers.includes('google') && (
        <Button
          size="lg"
          className="w-full !bg-[#4285F4] !text-white hover:!bg-[#4285F4]/80"
          onClick={() => handleOAuthSignIn('google')}
          disabled={isLoading !== null}
        >
          <GoogleLogoIcon className="mr-3 size-4" />
          {isLoading === 'google' ? t`Connecting...` : t`Google`}
        </Button>
      )}

      {providers.includes('github') && (
        <Button
          size="lg"
          className="w-full !bg-[#222] !text-white hover:!bg-[#222]/80"
          onClick={() => handleOAuthSignIn('github')}
          disabled={isLoading !== null}
        >
          <GithubLogoIcon className="mr-3 size-4" />
          {isLoading === 'github' ? t`Connecting...` : t`GitHub`}
        </Button>
      )}
    </div>
  );
};
