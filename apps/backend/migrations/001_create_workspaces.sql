-- Migration: Create Workspaces Tables
-- Description: This migration creates the workspaces, workspace_role enum, and workspace_members tables
-- Dependencies: Assumes Clerk is integrated with Supabase and auth.users table exists

-- Create workspaces table
-- Workspaces are the top-level containers for projects and members.
CREATE TABLE IF NOT EXISTS "workspaces" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "owner_id" UUID NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index on owner_id for faster queries
CREATE INDEX IF NOT EXISTS "idx_workspaces_owner_id" ON "workspaces"("owner_id");

-- Defines the roles a user can have in a workspace.
DO $$ BEGIN
    CREATE TYPE "workspace_role" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Junction table to link users to workspaces with specific roles.
CREATE TABLE IF NOT EXISTS "workspace_members" (
    "workspace_id" UUID NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
    "user_id" UUID NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "role" "workspace_role" NOT NULL DEFAULT 'MEMBER',
    PRIMARY KEY ("workspace_id", "user_id")
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS "idx_workspace_members_workspace_id" ON "workspace_members"("workspace_id");
CREATE INDEX IF NOT EXISTS "idx_workspace_members_user_id" ON "workspace_members"("user_id");

-- Optional: Add Row Level Security (RLS) policies
-- Uncomment the following lines if you want to enable RLS

-- Enable RLS on workspaces table
-- ALTER TABLE "workspaces" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view workspaces they are members of
-- CREATE POLICY "Users can view their workspaces"
--     ON "workspaces" FOR SELECT
--     USING (
--         EXISTS (
--             SELECT 1 FROM "workspace_members"
--             WHERE "workspace_members"."workspace_id" = "workspaces"."id"
--             AND "workspace_members"."user_id" = auth.uid()
--         )
--     );

-- Policy: Users can create workspaces
-- CREATE POLICY "Users can create workspaces"
--     ON "workspaces" FOR INSERT
--     WITH CHECK (auth.uid() = "owner_id");

-- Policy: Only workspace owners can update workspaces
-- CREATE POLICY "Workspace owners can update"
--     ON "workspaces" FOR UPDATE
--     USING (auth.uid() = "owner_id")
--     WITH CHECK (auth.uid() = "owner_id");

-- Policy: Only workspace owners can delete workspaces
-- CREATE POLICY "Workspace owners can delete"
--     ON "workspaces" FOR DELETE
--     USING (auth.uid() = "owner_id");

-- Enable RLS on workspace_members table
-- ALTER TABLE "workspace_members" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view members of workspaces they belong to
-- CREATE POLICY "Users can view workspace members"
--     ON "workspace_members" FOR SELECT
--     USING (
--         EXISTS (
--             SELECT 1 FROM "workspace_members" AS wm
--             WHERE wm."workspace_id" = "workspace_members"."workspace_id"
--             AND wm."user_id" = auth.uid()
--         )
--     );

-- Policy: Workspace owners and admins can add members
-- CREATE POLICY "Admins can add members"
--     ON "workspace_members" FOR INSERT
--     WITH CHECK (
--         EXISTS (
--             SELECT 1 FROM "workspace_members" AS wm
--             WHERE wm."workspace_id" = "workspace_members"."workspace_id"
--             AND wm."user_id" = auth.uid()
--             AND wm."role" IN ('OWNER', 'ADMIN')
--         )
--     );

-- Policy: Workspace owners and admins can update member roles
-- CREATE POLICY "Admins can update member roles"
--     ON "workspace_members" FOR UPDATE
--     USING (
--         EXISTS (
--             SELECT 1 FROM "workspace_members" AS wm
--             WHERE wm."workspace_id" = "workspace_members"."workspace_id"
--             AND wm."user_id" = auth.uid()
--             AND wm."role" IN ('OWNER', 'ADMIN')
--         )
--     );

-- Policy: Workspace owners and admins can remove members
-- CREATE POLICY "Admins can remove members"
--     ON "workspace_members" FOR DELETE
--     USING (
--         EXISTS (
--             SELECT 1 FROM "workspace_members" AS wm
--             WHERE wm."workspace_id" = "workspace_members"."workspace_id"
--             AND wm."user_id" = auth.uid()
--             AND wm."role" IN ('OWNER', 'ADMIN')
--         )
--     );

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Workspaces tables created successfully!';
    RAISE NOTICE 'Note: RLS policies are commented out. Uncomment them if you want to enable RLS.';
END $$;

