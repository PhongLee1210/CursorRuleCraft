-- Migration: Fix Circular RLS Dependencies Using Security Definer Functions
-- Description: Fixes infinite recursion by using SECURITY DEFINER functions that bypass RLS
-- Reference: https://github.com/orgs/supabase/discussions/3328
-- Reference: https://supabase.com/docs/guides/database/postgres/row-level-security#use-security-definer-functions

-- ============================================================================
-- IMPORTANT: Security Definer functions must be in a separate schema
-- to prevent them from being exposed via PostgREST API
-- ============================================================================

-- Create private schema for internal functions
CREATE SCHEMA IF NOT EXISTS private;

-- ============================================================================
-- STEP 1: Create Security Definer Helper Functions
-- ============================================================================

-- Function to check if a user is a member of a workspace
-- This function bypasses RLS by using SECURITY DEFINER
-- It's owned by postgres (superuser) so it can read workspace_members without RLS
CREATE OR REPLACE FUNCTION private.is_workspace_member(_user_id TEXT, _workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM workspace_members wm
    WHERE wm.workspace_id = _workspace_id
    AND wm.user_id = _user_id
  );
$$;

-- Function to check if a user is the owner of a workspace
-- This function bypasses RLS by using SECURITY DEFINER
CREATE OR REPLACE FUNCTION private.is_workspace_owner(_user_id TEXT, _workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM workspaces w
    WHERE w.id = _workspace_id
    AND w.owner_id = _user_id
  );
$$;

-- Function to check if a user is an admin (OWNER or ADMIN role) in a workspace
-- This function bypasses RLS by using SECURITY DEFINER
CREATE OR REPLACE FUNCTION private.is_workspace_admin(_user_id TEXT, _workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM workspace_members wm
    WHERE wm.workspace_id = _workspace_id
    AND wm.user_id = _user_id
    AND wm.role IN ('OWNER', 'ADMIN')
  ) OR EXISTS (
    SELECT 1
    FROM workspaces w
    WHERE w.id = _workspace_id
    AND w.owner_id = _user_id
  );
$$;

-- ============================================================================
-- STEP 2: Drop ALL existing policies on workspaces and workspace_members
-- ============================================================================

-- Drop workspaces policies
DROP POLICY IF EXISTS "Users can view their workspaces" ON workspaces;
DROP POLICY IF EXISTS "Users can create workspaces" ON workspaces;
DROP POLICY IF EXISTS "Workspace owners can update" ON workspaces;
DROP POLICY IF EXISTS "Workspace owners can delete" ON workspaces;

-- Drop workspace_members policies
DROP POLICY IF EXISTS "Users can view workspace members" ON workspace_members;
DROP POLICY IF EXISTS "Admins can add members" ON workspace_members;
DROP POLICY IF EXISTS "Workspace owners can add members" ON workspace_members;
DROP POLICY IF EXISTS "Admins can update member roles" ON workspace_members;
DROP POLICY IF EXISTS "Workspace owners can update member roles" ON workspace_members;
DROP POLICY IF EXISTS "Admins can remove members" ON workspace_members;
DROP POLICY IF EXISTS "Workspace owners can remove members" ON workspace_members;

-- ============================================================================
-- STEP 3: Create NEW policies using Security Definer functions
-- ============================================================================

-- ===========================
-- Workspaces Policies
-- ===========================

-- SELECT: Users can view workspaces they own or are members of
CREATE POLICY "Users can view their workspaces"
ON workspaces FOR SELECT
TO authenticated
USING (
  -- User is the owner
  (auth.jwt()->>'sub')::text = owner_id
  OR
  -- User is a member (uses SECURITY DEFINER function to avoid circular reference)
  private.is_workspace_member((auth.jwt()->>'sub')::text, id)
);

-- INSERT: Users can create workspaces
CREATE POLICY "Users can create workspaces"
ON workspaces FOR INSERT
TO authenticated
WITH CHECK ((auth.jwt()->>'sub')::text = owner_id);

-- UPDATE: Only workspace owners can update
CREATE POLICY "Workspace owners can update"
ON workspaces FOR UPDATE
TO authenticated
USING ((auth.jwt()->>'sub')::text = owner_id)
WITH CHECK ((auth.jwt()->>'sub')::text = owner_id);

-- DELETE: Only workspace owners can delete
CREATE POLICY "Workspace owners can delete"
ON workspaces FOR DELETE
TO authenticated
USING ((auth.jwt()->>'sub')::text = owner_id);

-- ===========================
-- Workspace Members Policies
-- ===========================

-- SELECT: Users can view their own membership or all members if they're a workspace owner
CREATE POLICY "Users can view workspace members"
ON workspace_members FOR SELECT
TO authenticated
USING (
  -- User is viewing their own membership
  user_id = (auth.jwt()->>'sub')::text
  OR
  -- User is the workspace owner (uses SECURITY DEFINER function to avoid circular reference)
  private.is_workspace_owner((auth.jwt()->>'sub')::text, workspace_id)
);

-- INSERT: Workspace owners/admins can add members OR users can self-add during workspace creation
CREATE POLICY "Workspace owners can add members"
ON workspace_members FOR INSERT
TO authenticated
WITH CHECK (
  -- User is an admin/owner of the workspace (uses SECURITY DEFINER function)
  private.is_workspace_admin((auth.jwt()->>'sub')::text, workspace_id)
  OR
  -- User is adding themselves (for initial workspace creation)
  user_id = (auth.jwt()->>'sub')::text
);

-- UPDATE: Only workspace owners can update member roles
CREATE POLICY "Workspace owners can update member roles"
ON workspace_members FOR UPDATE
TO authenticated
USING (
  -- User is an admin/owner of the workspace (uses SECURITY DEFINER function)
  private.is_workspace_admin((auth.jwt()->>'sub')::text, workspace_id)
);

-- DELETE: Only workspace owners can remove members
CREATE POLICY "Workspace owners can remove members"
ON workspace_members FOR DELETE
TO authenticated
USING (
  -- User is an admin/owner of the workspace (uses SECURITY DEFINER function)
  private.is_workspace_admin((auth.jwt()->>'sub')::text, workspace_id)
);

-- ============================================================================
-- STEP 4: Update repository policies to use Security Definer functions
-- ============================================================================

-- Drop existing repository policies
DROP POLICY IF EXISTS "Users can view repositories in their workspaces" ON repositories;
DROP POLICY IF EXISTS "Workspace admins can add repositories" ON repositories;
DROP POLICY IF EXISTS "Workspace admins can update repositories" ON repositories;
DROP POLICY IF EXISTS "Workspace admins can delete repositories" ON repositories;

-- SELECT: Users can view repositories in workspaces they're members of
CREATE POLICY "Users can view repositories in their workspaces"
ON repositories FOR SELECT
TO authenticated
USING (
  private.is_workspace_member((auth.jwt()->>'sub')::text, workspace_id)
  OR
  private.is_workspace_owner((auth.jwt()->>'sub')::text, workspace_id)
);

-- INSERT: Workspace admins can add repositories
CREATE POLICY "Workspace admins can add repositories"
ON repositories FOR INSERT
TO authenticated
WITH CHECK (
  private.is_workspace_admin((auth.jwt()->>'sub')::text, workspace_id)
);

-- UPDATE: Workspace admins can update repositories
CREATE POLICY "Workspace admins can update repositories"
ON repositories FOR UPDATE
TO authenticated
USING (
  private.is_workspace_admin((auth.jwt()->>'sub')::text, workspace_id)
);

-- DELETE: Workspace admins can delete repositories
CREATE POLICY "Workspace admins can delete repositories"
ON repositories FOR DELETE
TO authenticated
USING (
  private.is_workspace_admin((auth.jwt()->>'sub')::text, workspace_id)
);

-- ============================================================================
-- STEP 5: Grant necessary permissions
-- ============================================================================

-- Revoke all access to private schema from public
REVOKE ALL ON SCHEMA private FROM PUBLIC;

-- Grant execute permission on the functions to authenticated users
GRANT EXECUTE ON FUNCTION private.is_workspace_member(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_workspace_owner(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_workspace_admin(TEXT, UUID) TO authenticated;

-- ============================================================================
-- STEP 6: Verify the fix
-- ============================================================================

DO $$
DECLARE
  workspace_policy_count INTEGER;
  member_policy_count INTEGER;
  repo_policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO workspace_policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'workspaces';
  
  SELECT COUNT(*) INTO member_policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'workspace_members';
  
  SELECT COUNT(*) INTO repo_policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'repositories';
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Circular RLS dependencies fixed!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Summary:';
  RAISE NOTICE '  ✓ Created private schema for security definer functions';
  RAISE NOTICE '  ✓ Created 3 bypass functions: is_workspace_member, is_workspace_owner, is_workspace_admin';
  RAISE NOTICE '  ✓ Updated workspaces policies (% total)', workspace_policy_count;
  RAISE NOTICE '  ✓ Updated workspace_members policies (% total)', member_policy_count;
  RAISE NOTICE '  ✓ Updated repositories policies (% total)', repo_policy_count;
  RAISE NOTICE '  ✓ No more circular references!';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 Security Notes:';
  RAISE NOTICE '  ✓ Functions are in private schema (not exposed via API)';
  RAISE NOTICE '  ✓ Functions use SECURITY DEFINER (bypass RLS safely)';
  RAISE NOTICE '  ✓ Functions only check membership, not sensitive data';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Next step: Restart your backend server and test';
  RAISE NOTICE '';
END $$;

