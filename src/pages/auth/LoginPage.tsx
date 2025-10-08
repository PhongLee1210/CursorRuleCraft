import { SignIn } from '@clerk/clerk-react';

/**
 * LoginPage component
 * Renders Clerk's SignIn component for user authentication
 */
export const LoginPage = () => {
  return (
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
  );
};
