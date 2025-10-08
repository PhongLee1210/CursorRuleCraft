/**
 * Database types for Supabase
 * These types should match your Supabase database schema
 *
 * To generate these types automatically, run:
 * npx supabase gen types typescript --project-id your-project-ref > src/types/database.ts
 */

export interface Database {
  public: {
    Tables: {
      instruments: {
        Row: {
          id: number;
          name: string;
          created_at?: string;
        };
        Insert: {
          name: string;
          created_at?: string;
        };
        Update: {
          name?: string;
          created_at?: string;
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
      // Add database enums here
    };
  };
}

// Helper types for easier access
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type Inserts<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type Updates<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// Specific table types
export type Instrument = Tables<'instruments'>;
export type InstrumentInsert = Inserts<'instruments'>;
export type InstrumentUpdate = Updates<'instruments'>;
