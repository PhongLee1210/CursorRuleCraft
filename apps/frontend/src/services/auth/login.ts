import { useSignIn } from '@clerk/clerk-react';
import type { SignInResource } from '@clerk/types';
import { useState } from 'react';

/**
 * Options for logging in a user.
 */
export interface LoginOptions {
  identifier: string;
  password: string;
}

/**
 * Hook for handling user login.
 * It wraps Clerk's `useSignIn` hook to provide a simplified login function.
 *
 * @returns An object with the `login` function, `isLoading` state, and the original `signIn` resource.
 */
export function useLogin() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [isLoading, setIsLoading] = useState(false);

  const login = async (options: LoginOptions): Promise<SignInResource> => {
    if (!isLoaded) {
      throw new Error('SignIn is not loaded');
    }

    setIsLoading(true);
    try {
      const result = await signIn.create({
        identifier: options.identifier,
        password: options.password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
      }

      return result;
    } finally {
      setIsLoading(false);
    }
  };

  return { login, isLoading, signIn, isLoaded };
}
