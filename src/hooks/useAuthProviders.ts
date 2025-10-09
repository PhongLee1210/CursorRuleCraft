/**
 * useAuthProviders Hook
 * Provides available OAuth authentication providers configured in Clerk
 */

/**
 * Supported OAuth provider types
 */
export type OAuthProvider = 'github' | 'google' | 'openid' | 'email';

/**
 * Currently supported OAuth providers
 * Modify this array to add or remove providers
 */
const SUPPORTED_PROVIDERS: OAuthProvider[] = ['google', 'github'];

/**
 * Hook return type
 */
export interface UseAuthProvidersReturn {
  providers: OAuthProvider[];
  isProviderEnabled: (provider: OAuthProvider) => boolean;
  hasOAuthProviders: boolean;
}

/**
 * Hook that returns the available OAuth authentication providers.
 * Currently supports: Google and GitHub
 *
 * @example
 * ```tsx
 * function SocialAuth() {
 *   const { providers, isProviderEnabled, hasOAuthProviders } = useAuthProviders();
 *
 *   if (!hasOAuthProviders) {
 *     return null;
 *   }
 *
 *   return (
 *     <div>
 *       {providers.map(provider => (
 *         <Button key={provider} onClick={() => signInWith(provider)}>
 *           Sign in with {provider}
 *         </Button>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 *
 * @returns {UseAuthProvidersReturn} Object containing providers array and helper functions
 */
export function useAuthProviders(): UseAuthProvidersReturn {
  /**
   * Check if a specific provider is enabled
   */
  const isProviderEnabled = (provider: OAuthProvider): boolean => {
    return SUPPORTED_PROVIDERS.includes(provider);
  };

  return {
    providers: SUPPORTED_PROVIDERS,
    isProviderEnabled,
    hasOAuthProviders: SUPPORTED_PROVIDERS.length > 0,
  };
}
