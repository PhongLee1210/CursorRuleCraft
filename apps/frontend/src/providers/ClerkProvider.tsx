import type { PropsWithChildren } from 'react';

import { ClerkProvider as BaseClerkProvider } from '@clerk/clerk-react';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error(
    'Missing Clerk Publishable Key. Please add VITE_CLERK_PUBLISHABLE_KEY to your .env file. ' +
      'You can get your key from https://dashboard.clerk.com'
  );
}

export const ClerkProvider = ({ children }: PropsWithChildren) => {
  return (
    <BaseClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      signInForceRedirectUrl="/dashboard"
      signUpForceRedirectUrl="/dashboard"
      afterSignOutUrl="/auth/login"
      signInUrl="/auth/login"
      signUpUrl="/auth/register"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
      appearance={{
        variables: {
          colorPrimary: 'hsl(var(--primary))',
        },
      }}
    >
      {children}
    </BaseClerkProvider>
  );
};
