import { type Database } from '@/types/database';
import { useAuth } from '@clerk/clerk-react';
import { createClient } from '@supabase/supabase-js';
import { useMemo } from 'react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

if (!supabaseUrl || !supabasePublishableKey) {
  console.warn(
    '⚠️  Supabase environment variables not set. Please create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to use Supabase features.'
  );
}

/**
 * Custom hook to create a Supabase client that integrates with Clerk authentication.
 * This client automatically injects the Clerk session token into all Supabase requests.
 *
 * **Usage:** Always use this hook in React components to ensure your Supabase requests
 * are authenticated with Clerk.
 *
 * @returns SupabaseClient instance configured with Clerk authentication
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const supabase = useSupabaseClient();
 *
 *   const fetchData = async () => {
 *     const { data, error } = await supabase.from('tasks').select();
 *     if (error) throw error;
 *     return data;
 *   };
 * }
 * ```
 *
 * @see https://clerk.com/docs/guides/development/integrations/databases/supabase
 */
export function useSupabaseClient() {
  const { getToken } = useAuth();

  return useMemo(() => {
    return createClient<Database>(supabaseUrl, supabasePublishableKey, {
      global: {
        // Inject Clerk session token into all Supabase requests
        // @ts-ignore - Supabase fetch type doesn't match exactly but works correctly
        fetch: async (url: URL | RequestInfo, options: RequestInit = {}) => {
          const clerkToken = await getToken({ template: 'supabase' });

          const headers = new Headers(options.headers);
          if (clerkToken) {
            headers.set('Authorization', `Bearer ${clerkToken}`);
          }

          // Return fetch with updated headers
          return fetch(url, {
            ...options,
            headers,
          });
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }, [getToken]);
}
