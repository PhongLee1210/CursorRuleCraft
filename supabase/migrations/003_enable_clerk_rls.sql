-- Migration: Enable Clerk Authentication with RLS
-- Description: This migration removes the users sync table and enables RLS policies using Clerk JWT
-- Dependencies: Requires Clerk to be set up as a third-party auth provider in Supabase
-- Reference: https://clerk.com/docs/guides/development/integrations/databases/supabase

-- ============================================================================
-- STEP 1: Drop the users table (Clerk becomes the single source of truth)
-- ============================================================================

-- Drop the users table since we'll use Clerk for user data
-- This will cascade and remove all foreign key constraints
DROP TABLE IF EXISTS "users" CASCADE;

-- Drop the trigger function if no other tables need it
-- (We'll recreate it if needed for other tables)
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ============================================================================
-- STEP 2: Recreate tables without users FK (use TEXT for Clerk user IDs)
-- ============================================================================

-- Recreate updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================================
-- STEP 3: Update workspaces table
-- ============================================================================

-- Drop existing workspaces table and recreate with user_id default from JWT
DROP TABLE IF EXISTS "workspace_members" CASCADE;
DROP TABLE IF EXISTS "workspaces" CASCADE;

CREATE TABLE "workspaces" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "owner_id" TEXT NOT NULL DEFAULT (auth.jwt()->>'sub'), -- Gets Clerk user ID from JWT
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "idx_workspaces_owner_id" ON "workspaces"("owner_id");

-- Recreate workspace_members table
DO $$ BEGIN
    CREATE TYPE "workspace_role" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE "workspace_members" (
    "workspace_id" UUID NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
    "user_id" TEXT NOT NULL DEFAULT (auth.jwt()->>'sub'), -- Gets Clerk user ID from JWT
    "role" "workspace_role" NOT NULL DEFAULT 'MEMBER',
    PRIMARY KEY ("workspace_id", "user_id")
);

CREATE INDEX "idx_workspace_members_workspace_id" ON "workspace_members"("workspace_id");
CREATE INDEX "idx_workspace_members_user_id" ON "workspace_members"("user_id");

-- ============================================================================
-- STEP 4: Update git_integrations and repositories tables
-- ============================================================================

DROP TABLE IF EXISTS "repositories" CASCADE;
DROP TABLE IF EXISTS "git_integrations" CASCADE;

DO $$ BEGIN
    CREATE TYPE "git_provider" AS ENUM ('GITHUB', 'GITLAB', 'BITBUCKET');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE "git_integrations" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL DEFAULT (auth.jwt()->>'sub'), -- Gets Clerk user ID from JWT
    "provider" "git_provider" NOT NULL,
    "provider_user_id" TEXT NOT NULL,
    "provider_username" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT,
    "token_expires_at" TIMESTAMPTZ,
    "scopes" TEXT[] NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE ("user_id", "provider")
);

CREATE INDEX "idx_git_integrations_user_id" ON "git_integrations"("user_id");
CREATE INDEX "idx_git_integrations_provider" ON "git_integrations"("provider");

CREATE TABLE "repositories" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
    "git_integration_id" UUID NOT NULL REFERENCES "git_integrations"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "provider" "git_provider" NOT NULL,
    "provider_repo_id" TEXT NOT NULL,
    "default_branch" TEXT NOT NULL DEFAULT 'main',
    "is_private" BOOLEAN NOT NULL DEFAULT false,
    "language" TEXT,
    "topics" TEXT[] DEFAULT '{}',
    "stars_count" INTEGER DEFAULT 0,
    "forks_count" INTEGER DEFAULT 0,
    "last_synced_at" TIMESTAMPTZ,
    "sync_status" TEXT DEFAULT 'idle',
    "sync_error" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE ("workspace_id", "provider_repo_id")
);

CREATE INDEX "idx_repositories_workspace_id" ON "repositories"("workspace_id");
CREATE INDEX "idx_repositories_git_integration_id" ON "repositories"("git_integration_id");
CREATE INDEX "idx_repositories_provider" ON "repositories"("provider");
CREATE INDEX "idx_repositories_provider_repo_id" ON "repositories"("provider_repo_id");
CREATE INDEX "idx_repositories_full_name" ON "repositories"("full_name");

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

-- ============================================================================
-- STEP 5: Enable Row Level Security (RLS) policies
-- ============================================================================

-- Enable RLS on workspaces
ALTER TABLE "workspaces" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view workspaces they are members of
CREATE POLICY "Users can view their workspaces"
    ON "workspaces" FOR SELECT
    TO authenticated
    USING (
        (auth.jwt()->>'sub')::text = owner_id
        OR EXISTS (
            SELECT 1 FROM "workspace_members"
            WHERE "workspace_members"."workspace_id" = "workspaces"."id"
            AND "workspace_members"."user_id" = (auth.jwt()->>'sub')::text
        )
    );

-- Policy: Users can create workspaces (owner_id will be set automatically from JWT)
CREATE POLICY "Users can create workspaces"
    ON "workspaces" FOR INSERT
    TO authenticated
    WITH CHECK ((auth.jwt()->>'sub')::text = owner_id);

-- Policy: Only workspace owners can update workspaces
CREATE POLICY "Workspace owners can update"
    ON "workspaces" FOR UPDATE
    TO authenticated
    USING ((auth.jwt()->>'sub')::text = owner_id)
    WITH CHECK ((auth.jwt()->>'sub')::text = owner_id);

-- Policy: Only workspace owners can delete workspaces
CREATE POLICY "Workspace owners can delete"
    ON "workspaces" FOR DELETE
    TO authenticated
    USING ((auth.jwt()->>'sub')::text = owner_id);

-- Enable RLS on workspace_members
ALTER TABLE "workspace_members" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view members of workspaces they belong to
CREATE POLICY "Users can view workspace members"
    ON "workspace_members" FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM "workspace_members" AS wm
            WHERE wm."workspace_id" = "workspace_members"."workspace_id"
            AND wm."user_id" = (auth.jwt()->>'sub')::text
        )
    );

-- Policy: Workspace owners and admins can add members
CREATE POLICY "Admins can add members"
    ON "workspace_members" FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "workspace_members" AS wm
            WHERE wm."workspace_id" = "workspace_members"."workspace_id"
            AND wm."user_id" = (auth.jwt()->>'sub')::text
            AND wm."role" IN ('OWNER', 'ADMIN')
        )
        OR EXISTS (
            SELECT 1 FROM "workspaces" AS w
            WHERE w."id" = "workspace_members"."workspace_id"
            AND w."owner_id" = (auth.jwt()->>'sub')::text
        )
    );

-- Policy: Workspace owners and admins can update member roles
CREATE POLICY "Admins can update member roles"
    ON "workspace_members" FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM "workspace_members" AS wm
            WHERE wm."workspace_id" = "workspace_members"."workspace_id"
            AND wm."user_id" = (auth.jwt()->>'sub')::text
            AND wm."role" IN ('OWNER', 'ADMIN')
        )
        OR EXISTS (
            SELECT 1 FROM "workspaces" AS w
            WHERE w."id" = "workspace_members"."workspace_id"
            AND w."owner_id" = (auth.jwt()->>'sub')::text
        )
    );

-- Policy: Workspace owners and admins can remove members
CREATE POLICY "Admins can remove members"
    ON "workspace_members" FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM "workspace_members" AS wm
            WHERE wm."workspace_id" = "workspace_members"."workspace_id"
            AND wm."user_id" = (auth.jwt()->>'sub')::text
            AND wm."role" IN ('OWNER', 'ADMIN')
        )
        OR EXISTS (
            SELECT 1 FROM "workspaces" AS w
            WHERE w."id" = "workspace_members"."workspace_id"
            AND w."owner_id" = (auth.jwt()->>'sub')::text
        )
    );

-- Enable RLS on git_integrations
ALTER TABLE "git_integrations" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own integrations
CREATE POLICY "Users can view their own git integrations"
    ON "git_integrations" FOR SELECT
    TO authenticated
    USING ((auth.jwt()->>'sub')::text = user_id);

-- Policy: Users can create their own integrations
CREATE POLICY "Users can create git integrations"
    ON "git_integrations" FOR INSERT
    TO authenticated
    WITH CHECK ((auth.jwt()->>'sub')::text = user_id);

-- Policy: Users can update their own integrations
CREATE POLICY "Users can update their own git integrations"
    ON "git_integrations" FOR UPDATE
    TO authenticated
    USING ((auth.jwt()->>'sub')::text = user_id)
    WITH CHECK ((auth.jwt()->>'sub')::text = user_id);

-- Policy: Users can delete their own integrations
CREATE POLICY "Users can delete their own git integrations"
    ON "git_integrations" FOR DELETE
    TO authenticated
    USING ((auth.jwt()->>'sub')::text = user_id);

-- Enable RLS on repositories
ALTER TABLE "repositories" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view repositories in workspaces they are members of
CREATE POLICY "Users can view repositories in their workspaces"
    ON "repositories" FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM "workspace_members"
            WHERE "workspace_members"."workspace_id" = "repositories"."workspace_id"
            AND "workspace_members"."user_id" = (auth.jwt()->>'sub')::text
        )
        OR EXISTS (
            SELECT 1 FROM "workspaces"
            WHERE "workspaces"."id" = "repositories"."workspace_id"
            AND "workspaces"."owner_id" = (auth.jwt()->>'sub')::text
        )
    );

-- Policy: Workspace admins can add repositories
CREATE POLICY "Workspace admins can add repositories"
    ON "repositories" FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "workspace_members"
            WHERE "workspace_members"."workspace_id" = "repositories"."workspace_id"
            AND "workspace_members"."user_id" = (auth.jwt()->>'sub')::text
            AND "workspace_members"."role" IN ('OWNER', 'ADMIN')
        )
        OR EXISTS (
            SELECT 1 FROM "workspaces"
            WHERE "workspaces"."id" = "repositories"."workspace_id"
            AND "workspaces"."owner_id" = (auth.jwt()->>'sub')::text
        )
    );

-- Policy: Workspace admins can update repositories
CREATE POLICY "Workspace admins can update repositories"
    ON "repositories" FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM "workspace_members"
            WHERE "workspace_members"."workspace_id" = "repositories"."workspace_id"
            AND "workspace_members"."user_id" = (auth.jwt()->>'sub')::text
            AND "workspace_members"."role" IN ('OWNER', 'ADMIN')
        )
        OR EXISTS (
            SELECT 1 FROM "workspaces"
            WHERE "workspaces"."id" = "repositories"."workspace_id"
            AND "workspaces"."owner_id" = (auth.jwt()->>'sub')::text
        )
    );

-- Policy: Workspace admins can delete repositories
CREATE POLICY "Workspace admins can delete repositories"
    ON "repositories" FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM "workspace_members"
            WHERE "workspace_members"."workspace_id" = "repositories"."workspace_id"
            AND "workspace_members"."user_id" = (auth.jwt()->>'sub')::text
            AND "workspace_members"."role" IN ('OWNER', 'ADMIN')
        )
        OR EXISTS (
            SELECT 1 FROM "workspaces"
            WHERE "workspaces"."id" = "repositories"."workspace_id"
            AND "workspaces"."owner_id" = (auth.jwt()->>'sub')::text
        )
    );

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Migration complete!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Summary:';
    RAISE NOTICE '  ✓ Removed users table (Clerk is now the source of truth)';
    RAISE NOTICE '  ✓ Updated all tables to use Clerk user IDs from JWT';
    RAISE NOTICE '  ✓ Enabled Row Level Security (RLS) on all tables';
    RAISE NOTICE '  ✓ Created RLS policies using auth.jwt()->>\047sub\047';
    RAISE NOTICE '';
    RAISE NOTICE '🔐 Next steps:';
    RAISE NOTICE '  1. Set up Clerk as a third-party auth provider in Supabase Dashboard';
    RAISE NOTICE '  2. Update backend to pass Clerk session tokens to Supabase';
    RAISE NOTICE '  3. Remove user sync logic from frontend and backend';
    RAISE NOTICE '';
    RAISE NOTICE '📚 Reference: https://clerk.com/docs/guides/development/integrations/databases/supabase';
END $$;

