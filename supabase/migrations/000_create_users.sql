-- Migration: Create Users Table
-- Description: This migration creates the users table for Clerk authentication
-- Dependencies: None (this should be the first migration)
-- Note: This is NOT using Supabase Auth - we're using Clerk for authentication

-- Create users table in public schema
-- This table stores user data synced from Clerk
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT PRIMARY KEY, -- Clerk user ID (not UUID, Clerk uses string IDs)
    "email" TEXT UNIQUE NOT NULL,
    "name" TEXT,
    "username" TEXT UNIQUE,
    "picture" TEXT,
    "locale" TEXT DEFAULT 'en-US',
    "email_verified" BOOLEAN DEFAULT false,
    "two_factor_enabled" BOOLEAN DEFAULT false,
    "provider" TEXT DEFAULT 'email',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users"("email");
CREATE INDEX IF NOT EXISTS "idx_users_username" ON "users"("username");
CREATE INDEX IF NOT EXISTS "idx_users_provider" ON "users"("provider");

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at trigger for users table
DROP TRIGGER IF EXISTS update_users_updated_at ON "users";
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON "users"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Users table created successfully!';
    RAISE NOTICE 'This table is designed to work with Clerk authentication.';
    RAISE NOTICE 'User IDs are TEXT (Clerk format), not UUIDs.';
END $$;

