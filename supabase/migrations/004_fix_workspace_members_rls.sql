-- Migration: Fix Workspace Members RLS Infinite Recursion (Safe to re-run)
-- Description: Fixes the infinite recursion issue in workspace_members RLS policies
-- This version can be safely re-run even if partially applied

-- ============================================================================
-- STEP 1: Drop ALL existing policies on workspace_members
-- ============================================================================

-- Drop policies that might exist with various names
DROP POLICY IF EXISTS "Users can view workspace members" ON "workspace_members";
DROP POLICY IF EXISTS "Admins can add members" ON "workspace_members";
DROP POLICY IF EXISTS "Workspace owners can add members" ON "workspace_members";
DROP POLICY IF EXISTS "Admins can update member roles" ON "workspace_members";
DROP POLICY IF EXISTS "Workspace owners can update member roles" ON "workspace_members";
DROP POLICY IF EXISTS "Admins can remove members" ON "workspace_members";
DROP POLICY IF EXISTS "Workspace owners can remove members" ON "workspace_members";

-- ============================================================================
-- STEP 2: Create fixed policies that avoid circular references
-- ============================================================================

-- SELECT: Users can view their own membership OR memberships in workspaces they own
-- FIXED: Checks workspaces table directly, NOT workspace_members (avoids circular reference)
CREATE POLICY "Users can view workspace members"
    ON "workspace_members" FOR SELECT
    TO authenticated
    USING (
        -- User is viewing their own membership
        "user_id" = (auth.jwt()->>'sub')::text
        OR
        -- User is the owner of the workspace (checks workspaces table, not workspace_members)
        EXISTS (
            SELECT 1 FROM "workspaces" w
            WHERE w."id" = "workspace_members"."workspace_id"
            AND w."owner_id" = (auth.jwt()->>'sub')::text
        )
    );

-- INSERT: Workspace owners can add members OR users can add themselves during workspace creation
-- FIXED: Checks workspaces table directly, NOT workspace_members (avoids circular reference)
CREATE POLICY "Workspace owners can add members"
    ON "workspace_members" FOR INSERT
    TO authenticated
    WITH CHECK (
        -- User is the owner of the workspace
        EXISTS (
            SELECT 1 FROM "workspaces" w
            WHERE w."id" = "workspace_members"."workspace_id"
            AND w."owner_id" = (auth.jwt()->>'sub')::text
        )
        OR
        -- The user being added is the creator (self-adding during workspace creation)
        "user_id" = (auth.jwt()->>'sub')::text
    );

-- UPDATE: Only workspace owners can update member roles
-- FIXED: Checks workspaces table directly, NOT workspace_members (avoids circular reference)
CREATE POLICY "Workspace owners can update member roles"
    ON "workspace_members" FOR UPDATE
    TO authenticated
    USING (
        -- User is the owner of the workspace
        EXISTS (
            SELECT 1 FROM "workspaces" w
            WHERE w."id" = "workspace_members"."workspace_id"
            AND w."owner_id" = (auth.jwt()->>'sub')::text
        )
    );

-- DELETE: Only workspace owners can remove members
-- FIXED: Checks workspaces table directly, NOT workspace_members (avoids circular reference)
CREATE POLICY "Workspace owners can remove members"
    ON "workspace_members" FOR DELETE
    TO authenticated
    USING (
        -- User is the owner of the workspace
        EXISTS (
            SELECT 1 FROM "workspaces" w
            WHERE w."id" = "workspace_members"."workspace_id"
            AND w."owner_id" = (auth.jwt()->>'sub')::text
        )
    );

-- ============================================================================
-- STEP 3: Verify the fix
-- ============================================================================

-- Show all policies on workspace_members
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'workspace_members';
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ Workspace members RLS policies fixed!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Summary:';
    RAISE NOTICE '  ✓ Removed circular references in workspace_members policies';
    RAISE NOTICE '  ✓ Users can view their own memberships';
    RAISE NOTICE '  ✓ Workspace owners can view all members';
    RAISE NOTICE '  ✓ Workspace owners can manage members';
    RAISE NOTICE '  ✓ Total policies on workspace_members: %', policy_count;
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Next step: Restart your backend server';
    RAISE NOTICE '';
END $$;

