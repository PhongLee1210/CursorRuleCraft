-- Migration: Enable RLS on Git Integration and Repositories Tables
-- Description: This migration enables Row Level Security (RLS) on git_integrations and repositories tables
-- Dependencies: Requires 002_create_repositories.sql to be applied first

-- Enable RLS on git_integrations table
ALTER TABLE "git_integrations" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view their own git integrations" ON "git_integrations";
DROP POLICY IF EXISTS "Users can create git integrations" ON "git_integrations";
DROP POLICY IF EXISTS "Users can update their own git integrations" ON "git_integrations";
DROP POLICY IF EXISTS "Users can delete their own git integrations" ON "git_integrations";

-- Policy: Users can only view their own integrations
CREATE POLICY "Users can view their own git integrations"
    ON "git_integrations" FOR SELECT
    USING ((auth.jwt()->>'sub') = "user_id");

-- Policy: Users can create their own integrations
CREATE POLICY "Users can create git integrations"
    ON "git_integrations" FOR INSERT
    WITH CHECK ((auth.jwt()->>'sub') = "user_id");

-- Policy: Users can update their own integrations
CREATE POLICY "Users can update their own git integrations"
    ON "git_integrations" FOR UPDATE
    USING ((auth.jwt()->>'sub') = "user_id")
    WITH CHECK ((auth.jwt()->>'sub') = "user_id");

-- Policy: Users can delete their own integrations
CREATE POLICY "Users can delete their own git integrations"
    ON "git_integrations" FOR DELETE
    USING ((auth.jwt()->>'sub') = "user_id");

-- Enable RLS on repositories table
ALTER TABLE "repositories" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view repositories in their workspaces" ON "repositories";
DROP POLICY IF EXISTS "Workspace admins can add repositories" ON "repositories";
DROP POLICY IF EXISTS "Workspace admins can update repositories" ON "repositories";
DROP POLICY IF EXISTS "Workspace admins can delete repositories" ON "repositories";

-- Policy: Users can view repositories in workspaces they are members of
CREATE POLICY "Users can view repositories in their workspaces"
    ON "repositories" FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "workspace_members"
            WHERE "workspace_members"."workspace_id" = "repositories"."workspace_id"
            AND "workspace_members"."user_id" = (auth.jwt()->>'sub')
        )
    );

-- Policy: Workspace admins can add repositories
CREATE POLICY "Workspace admins can add repositories"
    ON "repositories" FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "workspace_members"
            WHERE "workspace_members"."workspace_id" = "repositories"."workspace_id"
            AND "workspace_members"."user_id" = (auth.jwt()->>'sub')
            AND "workspace_members"."role" IN ('OWNER', 'ADMIN')
        )
    );

-- Policy: Workspace admins can update repositories
CREATE POLICY "Workspace admins can update repositories"
    ON "repositories" FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM "workspace_members"
            WHERE "workspace_members"."workspace_id" = "repositories"."workspace_id"
            AND "workspace_members"."user_id" = (auth.jwt()->>'sub')
            AND "workspace_members"."role" IN ('OWNER', 'ADMIN')
        )
    );

-- Policy: Workspace admins can delete repositories
CREATE POLICY "Workspace admins can delete repositories"
    ON "repositories" FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM "workspace_members"
            WHERE "workspace_members"."workspace_id" = "repositories"."workspace_id"
            AND "workspace_members"."user_id" = (auth.jwt()->>'sub')
            AND "workspace_members"."role" IN ('OWNER', 'ADMIN')
        )
    );

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'RLS enabled successfully for git_integrations and repositories tables!';
    RAISE NOTICE 'Policies created:';
    RAISE NOTICE '  - git_integrations: Users can only access their own integrations';
    RAISE NOTICE '  - repositories: Users can access repositories in their workspaces based on roles';
END $$;

