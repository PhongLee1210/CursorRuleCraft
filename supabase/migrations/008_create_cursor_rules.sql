-- Migration: Create Cursor Rules, Rule Versions, and Workspace Rule Snapshots Tables
-- Description: This migration creates tables for managing cursor rules, their version history, and workspace snapshots
-- Dependencies: Requires 002_create_repositories.sql and 005_fix_circular_rls_with_security_definer.sql to be applied first
--
-- NOTE: AI-related tables (repository_ai_sessions, ai_chat_messages) are NOT included yet
--       as they will be implemented in a future migration when AI features are added

-- ============================================================================
-- STEP 1: Create Enums
-- ============================================================================

-- Create rule_type enum
DO $$ BEGIN
    CREATE TYPE "rule_type" AS ENUM ('PROJECT_RULE', 'USER_RULE', 'COMMAND');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- STEP 2: Create cursor_rules Table
-- ============================================================================

-- This table stores cursor rules (project rules, user rules, and commands) for repositories
-- Schema follows AI_AGENT_ARCHITECTURE.md specification
CREATE TABLE IF NOT EXISTS "cursor_rules" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "repository_id" UUID NOT NULL REFERENCES "repositories"("id") ON DELETE CASCADE,
    "user_id" TEXT NOT NULL DEFAULT (auth.jwt()->>'sub'), -- Gets Clerk user ID from JWT
    "source_message_id" UUID, -- Reference to AI chat message (future feature, nullable for now)
    "type" "rule_type" NOT NULL,
    "file_name" TEXT NOT NULL, -- Normalized filename (lowercase, hyphens, no special chars)
    "content" TEXT NOT NULL, -- Rule content in any format (markdown, plain text, etc.)
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "current_version" INTEGER NOT NULL DEFAULT 1,
    "deleted_at" TIMESTAMPTZ, -- Soft delete timestamp
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT "cursor_rules_current_version_positive" CHECK ("current_version" > 0)
);

-- Create indexes for faster queries (only essential ones)
CREATE INDEX IF NOT EXISTS "idx_cursor_rules_repository_id" ON "cursor_rules"("repository_id"); -- FK lookups and joins
CREATE INDEX IF NOT EXISTS "idx_cursor_rules_deleted_at" ON "cursor_rules"("deleted_at") WHERE "deleted_at" IS NULL; -- Partial index for active rules
-- Composite index for common query pattern: finding rules by repository and type
CREATE INDEX IF NOT EXISTS "idx_cursor_rules_repo_type_active" ON "cursor_rules"("repository_id", "type", "is_active") WHERE "deleted_at" IS NULL;

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_cursor_rules_updated_at ON "cursor_rules";
CREATE TRIGGER update_cursor_rules_updated_at
    BEFORE UPDATE ON "cursor_rules"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on cursor_rules table
ALTER TABLE "cursor_rules" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view rules in their repositories" ON "cursor_rules";
DROP POLICY IF EXISTS "Users can create rules in their repositories" ON "cursor_rules";
DROP POLICY IF EXISTS "Users can update their own rules" ON "cursor_rules";
DROP POLICY IF EXISTS "Users can delete their own rules" ON "cursor_rules";

-- Policy: Users can view rules in repositories they have access to
-- Uses SECURITY DEFINER function to avoid circular RLS references
CREATE POLICY "Users can view rules in their repositories"
    ON "cursor_rules" FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM "repositories" r
            WHERE r."id" = "cursor_rules"."repository_id"
            AND private.is_workspace_member((auth.jwt()->>'sub')::text, r."workspace_id")
        )
    );

-- Policy: Users can create rules in repositories they have access to
CREATE POLICY "Users can create rules in their repositories"
    ON "cursor_rules" FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "repositories" r
            WHERE r."id" = "cursor_rules"."repository_id"
            AND private.is_workspace_member((auth.jwt()->>'sub')::text, r."workspace_id")
        )
        AND "user_id" = (auth.jwt()->>'sub')
    );

-- Policy: Users can update their own rules (or rules in repositories they are admin/owner of)
CREATE POLICY "Users can update their own rules"
    ON "cursor_rules" FOR UPDATE
    TO authenticated
    USING (
        -- User owns the rule
        "user_id" = (auth.jwt()->>'sub')
        OR
        -- User is admin/owner of the workspace containing the repository
        EXISTS (
            SELECT 1 FROM "repositories" r
            WHERE r."id" = "cursor_rules"."repository_id"
            AND private.is_workspace_admin((auth.jwt()->>'sub')::text, r."workspace_id")
        )
    )
    WITH CHECK (
        -- User owns the rule
        "user_id" = (auth.jwt()->>'sub')
        OR
        -- User is admin/owner of the workspace containing the repository
        EXISTS (
            SELECT 1 FROM "repositories" r
            WHERE r."id" = "cursor_rules"."repository_id"
            AND private.is_workspace_admin((auth.jwt()->>'sub')::text, r."workspace_id")
        )
    );

-- Policy: Users can delete their own rules (or rules in repositories they are admin/owner of)
CREATE POLICY "Users can delete their own rules"
    ON "cursor_rules" FOR DELETE
    TO authenticated
    USING (
        -- User owns the rule
        "user_id" = (auth.jwt()->>'sub')
        OR
        -- User is admin/owner of the workspace containing the repository
        EXISTS (
            SELECT 1 FROM "repositories" r
            WHERE r."id" = "cursor_rules"."repository_id"
            AND private.is_workspace_admin((auth.jwt()->>'sub')::text, r."workspace_id")
        )
    );

-- ============================================================================
-- STEP 3: Create rule_versions Table
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
-- STEP 4: Create workspace_rule_snapshots Table
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
DROP POLICY IF EXISTS "Users can delete their own snapshots" ON "workspace_rule_snapshots";

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
-- STEP 5: Success Message
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Cursor Rules schema created successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Tables created:';
    RAISE NOTICE '  ✓ cursor_rules: Stores cursor rules (PROJECT_RULE, USER_RULE, COMMAND)';
    RAISE NOTICE '  ✓ rule_versions: Tracks version history of cursor rules';
    RAISE NOTICE '  ✓ workspace_rule_snapshots: Stores complete snapshots of rule states';
    RAISE NOTICE '';
    RAISE NOTICE '📐 Schema matches AI_AGENT_ARCHITECTURE.md specification';
    RAISE NOTICE '';
    RAISE NOTICE '🔑 Features:';
    RAISE NOTICE '  ✓ cursor_rules:';
    RAISE NOTICE '    - file_name: Normalized filename for virtual tree structure';
    RAISE NOTICE '    - content: Flexible TEXT field supporting any format';
    RAISE NOTICE '    - deleted_at: Soft delete support';
    RAISE NOTICE '    - current_version: Version tracking';
    RAISE NOTICE '    - source_message_id: Nullable (for future AI integration)';
    RAISE NOTICE '  ✓ rule_versions:';
    RAISE NOTICE '    - Immutable version history';
    RAISE NOTICE '    - Unique constraint on (rule_id, version_number)';
    RAISE NOTICE '  ✓ workspace_rule_snapshots:';
    RAISE NOTICE '    - Complete JSONB snapshots of rule states';
    RAISE NOTICE '    - GIN index for efficient JSONB queries';
    RAISE NOTICE '    - Supports rollback and change tracking';
    RAISE NOTICE '';
    RAISE NOTICE '⚡ Optimized Indexing:';
    RAISE NOTICE '  ✓ Only essential indexes created (foreign keys, partial indexes, JSONB)';
    RAISE NOTICE '  ✓ Composite index on cursor_rules(repository_id, type, is_active)';
    RAISE NOTICE '  ✓ Avoids over-indexing to maintain fast write performance';
    RAISE NOTICE '';
    RAISE NOTICE '🔐 Security:';
    RAISE NOTICE '  ✓ RLS enabled on all tables';
    RAISE NOTICE '  ✓ Uses private.is_workspace_member() and private.is_workspace_admin()';
    RAISE NOTICE '  ✓ No circular RLS dependencies';
    RAISE NOTICE '  ✓ Workspace-based access control';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Note: AI tables (repository_ai_sessions, ai_chat_messages) not included';
    RAISE NOTICE '         They will be added in a future migration when AI features are implemented';
    RAISE NOTICE '';
END $$;

