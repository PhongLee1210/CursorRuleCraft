import { ClerkProvider as BaseClerkProvider } from '@clerk/clerk-react';
import type { PropsWithChildren } from 'react';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error(
    'Missing Clerk Publishable Key. Please add VITE_CLERK_PUBLISHABLE_KEY to your .env file. ' +
      'You can get your key from https://dashboard.clerk.com'
  );
}

export const ClerkProvider = ({ children }: PropsWithChildren) => {
  return (
    <BaseClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/auth/login">
      {children}
    </BaseClerkProvider>
  );
};
