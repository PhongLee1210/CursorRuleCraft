/**
 * Shared types for CursorRuleCraft monorepo
 * This package contains common types shared between frontend and backend
 */

// ============================================================================
// Git Integration Types
// ============================================================================

/**
 * Git provider types
 */
export enum GitProvider {
  GITHUB = 'GITHUB',
  GITLAB = 'GITLAB',
  BITBUCKET = 'BITBUCKET',
}

// ============================================================================
// API Response Wrappers
// ============================================================================

// API Response wrappers
export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Common entity properties
export interface BaseEntity {
  id: string | number;
  createdAt: Date;
  updatedAt: Date;
}

// Database types for Supabase
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      auth_provider: 'email' | 'github' | 'google' | 'openid';
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

// Auth provider type
export type AuthProvider = 'email' | 'github' | 'google' | 'openid';
