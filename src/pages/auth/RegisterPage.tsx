import { SignUp } from '@clerk/clerk-react';

/**
 * RegisterPage component
 * Renders Clerk's SignUp component for new user registration
 */
export const RegisterPage = () => {
  return (
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
  );
};
