import { SignUp } from '@clerk/clerk-react';

import { SEO } from '@/components/SEO';

/**
 * RegisterPage component
 * Renders Clerk's SignUp component for new user registration
 */
export const RegisterPage = () => {
  return (
    <>
      <SEO
        title="Register"
        description="Create a CursorRulesCraft account to start building and sharing cursor rules."
        url="https://cursorrulescraft.com/auth/register"
        noindex={true}
      />
      <div className="flex flex-col items-center">
        <SignUp
          appearance={{
            elements: {
              rootBox: 'w-full',
              card: 'bg-transparent shadow-none border-none',
            },
          }}
          signInUrl="/auth/login"
          afterSignUpUrl="/dashboard"
        />
      </div>
    </>
  );
};
