import { SignIn } from '@clerk/clerk-react';

import { SEO } from '@/components/SEO';

/**
 * LoginPage component
 * Renders Clerk's SignIn component for user authentication
 */
export const LoginPage = () => {
  return (
    <>
      <SEO
        title="Login"
        description="Sign in to your CursorRulesCraft account to manage your cursor rules and projects."
        url="https://cursorrulescraft.com/auth/login"
        noindex={true}
      />
      <div className="flex flex-col items-center">
        <SignIn
          appearance={{
            elements: {
              rootBox: 'w-full',
              card: 'bg-transparent shadow-none border-none',
            },
          }}
          signUpUrl="/auth/register"
          afterSignInUrl="/dashboard"
        />
      </div>
    </>
  );
};
