import { useSignUp } from '@clerk/clerk-react';
import type { SignUpResource } from '@clerk/types';
import { useState } from 'react';

/**
 * Options for registering a new user.
 */
export interface RegisterOptions {
  emailAddress: string;
  password: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Hook for handling user registration.
 * It wraps Clerk's `useSignUp` to simplify the registration flow.
 *
 * @returns An object with the `register` function, `isLoading` state, and the original `signUp` resource.
 */
export function useRegister() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [isLoading, setIsLoading] = useState(false);

  const register = async (options: RegisterOptions): Promise<SignUpResource> => {
    if (!isLoaded) {
      throw new Error('SignUp is not loaded');
    }

    setIsLoading(true);
    try {
      const result = await signUp.create(options);

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
      }

      return result;
    } finally {
      setIsLoading(false);
    }
  };

  return { register, isLoading, signUp, isLoaded };
}
