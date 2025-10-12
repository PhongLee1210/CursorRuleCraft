-- Migration: Add Rule Versions and Workspace Rule Snapshots Tables
-- Description: Adds version history and snapshot functionality for cursor rules
-- Dependencies: Requires 008_create_cursor_rules.sql to be applied first

-- ============================================================================
-- STEP 1: Create rule_versions Table
-- ============================================================================

-- This table stores version history for cursor rules
-- Allows tracking all changes made to a rule over time
CREATE TABLE IF NOT EXISTS "rule_versions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "rule_id" UUID NOT NULL REFERENCES "cursor_rules"("id") ON DELETE CASCADE,
    "version_number" INTEGER NOT NULL,
    "content" TEXT NOT NULL, -- Snapshot of rule content at this version
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT "rule_versions_version_number_positive" CHECK ("version_number" > 0),
    -- Ensure each rule can only have one version with a specific version number
    UNIQUE ("rule_id", "version_number")
);

-- Create indexes for faster queries (only essential ones)
CREATE INDEX IF NOT EXISTS "idx_rule_versions_rule_id" ON "rule_versions"("rule_id"); -- FK lookups for version history

-- Enable RLS on rule_versions table
ALTER TABLE "rule_versions" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view versions of rules they can access" ON "rule_versions";
DROP POLICY IF EXISTS "Users can create versions for rules they own" ON "rule_versions";

-- Policy: Users can view versions of rules they have access to
CREATE POLICY "Users can view versions of rules they can access"
    ON "rule_versions" FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM "cursor_rules" cr
            JOIN "repositories" r ON r."id" = cr."repository_id"
            WHERE cr."id" = "rule_versions"."rule_id"
            AND private.is_workspace_member((auth.jwt()->>'sub')::text, r."workspace_id")
        )
    );

-- Policy: System/Users can create versions for rules (typically done by triggers or application logic)
-- Only users who can update the rule can create versions
CREATE POLICY "Users can create versions for rules they own"
    ON "rule_versions" FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "cursor_rules" cr
            JOIN "repositories" r ON r."id" = cr."repository_id"
            WHERE cr."id" = "rule_versions"."rule_id"
            AND (
                cr."user_id" = (auth.jwt()->>'sub')
                OR private.is_workspace_admin((auth.jwt()->>'sub')::text, r."workspace_id")
            )
        )
    );

-- ============================================================================
-- STEP 2: Create workspace_rule_snapshots Table
-- ============================================================================

-- This table stores complete snapshots of all cursor rules in a repository at a point in time
-- Allows users to rollback to previous states or track major changes
CREATE TABLE IF NOT EXISTS "workspace_rule_snapshots" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "repository_id" UUID NOT NULL REFERENCES "repositories"("id") ON DELETE CASCADE,
    "user_id" TEXT NOT NULL DEFAULT (auth.jwt()->>'sub'), -- Gets Clerk user ID from JWT
    "snapshot_number" INTEGER NOT NULL,
    "description" TEXT, -- Optional description of why this snapshot was created
    "change_type" TEXT, -- Type of change: 'MANUAL', 'AUTO_BACKUP', 'PRE_GENERATION', 'POST_GENERATION', etc.
    "rules_snapshot" JSONB NOT NULL, -- Complete state of all active cursor rules at this point
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT "workspace_rule_snapshots_snapshot_number_positive" CHECK ("snapshot_number" > 0),
    -- Ensure each repository can only have one snapshot with a specific snapshot number
    UNIQUE ("repository_id", "snapshot_number")
);

-- Create indexes for faster queries (only essential ones)
CREATE INDEX IF NOT EXISTS "idx_workspace_rule_snapshots_repository_id" ON "workspace_rule_snapshots"("repository_id"); -- FK lookups
CREATE INDEX IF NOT EXISTS "idx_workspace_rule_snapshots_rules_snapshot" ON "workspace_rule_snapshots" USING GIN("rules_snapshot"); -- JSONB queries

-- Enable RLS on workspace_rule_snapshots table
ALTER TABLE "workspace_rule_snapshots" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view snapshots in their repositories" ON "workspace_rule_snapshots";
DROP POLICY IF EXISTS "Users can create snapshots in their repositories" ON "workspace_rule_snapshots";
DROP POLICY IF EXISTS "Admins can delete snapshots" ON "workspace_rule_snapshots";

-- Policy: Users can view snapshots in repositories they have access to
CREATE POLICY "Users can view snapshots in their repositories"
    ON "workspace_rule_snapshots" FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM "repositories" r
            WHERE r."id" = "workspace_rule_snapshots"."repository_id"
            AND private.is_workspace_member((auth.jwt()->>'sub')::text, r."workspace_id")
        )
    );

-- Policy: Users can create snapshots in repositories they have access to
CREATE POLICY "Users can create snapshots in their repositories"
    ON "workspace_rule_snapshots" FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "repositories" r
            WHERE r."id" = "workspace_rule_snapshots"."repository_id"
            AND private.is_workspace_member((auth.jwt()->>'sub')::text, r."workspace_id")
        )
        AND "user_id" = (auth.jwt()->>'sub')
    );

-- Policy: Admins can delete snapshots (to manage storage)
CREATE POLICY "Admins can delete snapshots"
    ON "workspace_rule_snapshots" FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM "repositories" r
            WHERE r."id" = "workspace_rule_snapshots"."repository_id"
            AND private.is_workspace_admin((auth.jwt()->>'sub')::text, r."workspace_id")
        )
    );

-- ============================================================================
-- STEP 3: Success Message
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Rule versions and snapshots tables created successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Tables created:';
    RAISE NOTICE '  ✓ rule_versions: Tracks version history of cursor rules';
    RAISE NOTICE '  ✓ workspace_rule_snapshots: Stores complete snapshots of rule states';
    RAISE NOTICE '';
    RAISE NOTICE '🔑 Features:';
    RAISE NOTICE '  ✓ rule_versions:';
    RAISE NOTICE '    - Immutable version history';
    RAISE NOTICE '    - Unique constraint on (rule_id, version_number)';
    RAISE NOTICE '    - Cascading delete with cursor_rules';
    RAISE NOTICE '  ✓ workspace_rule_snapshots:';
    RAISE NOTICE '    - Complete JSONB snapshots of rule states';
    RAISE NOTICE '    - GIN index for efficient JSONB queries';
    RAISE NOTICE '    - Supports rollback and change tracking';
    RAISE NOTICE '';
    RAISE NOTICE '⚡ Optimized Indexing:';
    RAISE NOTICE '  ✓ Only essential indexes (foreign keys and JSONB)';
    RAISE NOTICE '  ✓ Fast write performance maintained';
    RAISE NOTICE '';
    RAISE NOTICE '🔐 Security:';
    RAISE NOTICE '  ✓ RLS enabled on all tables';
    RAISE NOTICE '  ✓ Uses private.is_workspace_member() and private.is_workspace_admin()';
    RAISE NOTICE '  ✓ Workspace-based access control';
    RAISE NOTICE '';
END $$;

