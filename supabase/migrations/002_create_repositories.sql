-- Migration: Create Repositories and Git Integration Tables
-- Description: This migration creates the repositories, git_integrations, and related tables
-- Dependencies: Requires 001_create_workspaces.sql to be applied first

-- Create git_provider enum
DO $$ BEGIN
    CREATE TYPE "git_provider" AS ENUM ('GITHUB', 'GITLAB', 'BITBUCKET');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create git_integrations table
-- This table stores OAuth tokens and metadata for Git providers
CREATE TABLE IF NOT EXISTS "git_integrations" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "provider" "git_provider" NOT NULL,
    "provider_user_id" TEXT NOT NULL,
    "provider_username" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT,
    "token_expires_at" TIMESTAMPTZ,
    "scopes" TEXT[] NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Ensure a user can only have one integration per provider
    UNIQUE ("user_id", "provider")
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS "idx_git_integrations_user_id" ON "git_integrations"("user_id");
CREATE INDEX IF NOT EXISTS "idx_git_integrations_provider" ON "git_integrations"("provider");

-- Create repositories table
-- This table stores repositories that have been connected to workspaces
CREATE TABLE IF NOT EXISTS "repositories" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
    "git_integration_id" UUID NOT NULL REFERENCES "git_integrations"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "full_name" TEXT NOT NULL, -- e.g., "owner/repo"
    "description" TEXT,
    "url" TEXT NOT NULL,
    "provider" "git_provider" NOT NULL,
    "provider_repo_id" TEXT NOT NULL, -- External repository ID from Git provider
    "default_branch" TEXT NOT NULL DEFAULT 'main',
    "is_private" BOOLEAN NOT NULL DEFAULT false,
    "language" TEXT, -- Primary programming language
    "topics" TEXT[] DEFAULT '{}', -- Repository topics/tags
    "stars_count" INTEGER DEFAULT 0,
    "forks_count" INTEGER DEFAULT 0,
    "last_synced_at" TIMESTAMPTZ,
    "sync_status" TEXT DEFAULT 'idle', -- 'idle', 'syncing', 'success', 'error'
    "sync_error" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Ensure a repository can only be added once per workspace
    UNIQUE ("workspace_id", "provider_repo_id")
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS "idx_repositories_workspace_id" ON "repositories"("workspace_id");
CREATE INDEX IF NOT EXISTS "idx_repositories_git_integration_id" ON "repositories"("git_integration_id");
CREATE INDEX IF NOT EXISTS "idx_repositories_provider" ON "repositories"("provider");
CREATE INDEX IF NOT EXISTS "idx_repositories_provider_repo_id" ON "repositories"("provider_repo_id");
CREATE INDEX IF NOT EXISTS "idx_repositories_full_name" ON "repositories"("full_name");

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_git_integrations_updated_at ON "git_integrations";
CREATE TRIGGER update_git_integrations_updated_at
    BEFORE UPDATE ON "git_integrations"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_repositories_updated_at ON "repositories";
CREATE TRIGGER update_repositories_updated_at
    BEFORE UPDATE ON "repositories"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Optional: Add Row Level Security (RLS) policies
-- Uncomment the following lines if you want to enable RLS

-- Enable RLS on git_integrations table
-- ALTER TABLE "git_integrations" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own integrations
-- CREATE POLICY "Users can view their own git integrations"
--     ON "git_integrations" FOR SELECT
--     USING (auth.uid() = "user_id");

-- Policy: Users can create their own integrations
-- CREATE POLICY "Users can create git integrations"
--     ON "git_integrations" FOR INSERT
--     WITH CHECK (auth.uid() = "user_id");

-- Policy: Users can update their own integrations
-- CREATE POLICY "Users can update their own git integrations"
--     ON "git_integrations" FOR UPDATE
--     USING (auth.uid() = "user_id")
--     WITH CHECK (auth.uid() = "user_id");

-- Policy: Users can delete their own integrations
-- CREATE POLICY "Users can delete their own git integrations"
--     ON "git_integrations" FOR DELETE
--     USING (auth.uid() = "user_id");

-- Enable RLS on repositories table
-- ALTER TABLE "repositories" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view repositories in workspaces they are members of
-- CREATE POLICY "Users can view repositories in their workspaces"
--     ON "repositories" FOR SELECT
--     USING (
--         EXISTS (
--             SELECT 1 FROM "workspace_members"
--             WHERE "workspace_members"."workspace_id" = "repositories"."workspace_id"
--             AND "workspace_members"."user_id" = auth.uid()
--         )
--     );

-- Policy: Workspace admins can add repositories
-- CREATE POLICY "Workspace admins can add repositories"
--     ON "repositories" FOR INSERT
--     WITH CHECK (
--         EXISTS (
--             SELECT 1 FROM "workspace_members"
--             WHERE "workspace_members"."workspace_id" = "repositories"."workspace_id"
--             AND "workspace_members"."user_id" = auth.uid()
--             AND "workspace_members"."role" IN ('OWNER', 'ADMIN')
--         )
--     );

-- Policy: Workspace admins can update repositories
-- CREATE POLICY "Workspace admins can update repositories"
--     ON "repositories" FOR UPDATE
--     USING (
--         EXISTS (
--             SELECT 1 FROM "workspace_members"
--             WHERE "workspace_members"."workspace_id" = "repositories"."workspace_id"
--             AND "workspace_members"."user_id" = auth.uid()
--             AND "workspace_members"."role" IN ('OWNER', 'ADMIN')
--         )
--     );

-- Policy: Workspace admins can delete repositories
-- CREATE POLICY "Workspace admins can delete repositories"
--     ON "repositories" FOR DELETE
--     USING (
--         EXISTS (
--             SELECT 1 FROM "workspace_members"
--             WHERE "workspace_members"."workspace_id" = "repositories"."workspace_id"
--             AND "workspace_members"."user_id" = auth.uid()
--             AND "workspace_members"."role" IN ('OWNER', 'ADMIN')
--         )
--     );

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Repositories and Git Integration tables created successfully!';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '  - git_integrations: Stores OAuth tokens for Git providers';
    RAISE NOTICE '  - repositories: Stores connected repositories';
    RAISE NOTICE 'Note: RLS policies are commented out. Uncomment them if you want to enable RLS.';
END $$;

