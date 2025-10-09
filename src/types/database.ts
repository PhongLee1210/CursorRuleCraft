/**
 * Database types for Supabase
 * These types should match your Supabase database schema
 *
 * To generate these types automatically, run:
 * npx supabase gen types typescript --project-id your-project-ref > src/types/database.ts
 */

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          picture: string | null;
          username: string;
          email: string;
          locale: string;
          email_verified: boolean;
          two_factor_enabled: boolean;
          provider: 'email' | 'github' | 'google' | 'openid';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          picture?: string | null;
          username: string;
          email: string;
          locale?: string;
          email_verified?: boolean;
          two_factor_enabled?: boolean;
          provider?: 'email' | 'github' | 'google' | 'openid';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          picture?: string | null;
          username?: string;
          email?: string;
          locale?: string;
          email_verified?: boolean;
          two_factor_enabled?: boolean;
          provider?: 'email' | 'github' | 'google' | 'openid';
          updated_at?: string;
        };
      };
      // Add more tables here as you create them
    };
    Views: {
      // Add database views here
    };
    Functions: {
      // Add database functions here
    };
    Enums: {
      auth_provider: 'email' | 'github' | 'google' | 'openid';
      // Add database enums here
    };
  };
};

// Helper types for easier access
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type Inserts<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type Updates<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

// Specific table types
export type User = Tables<'users'>;
export type UserInsert = Inserts<'users'>;
export type UserUpdate = Updates<'users'>;
