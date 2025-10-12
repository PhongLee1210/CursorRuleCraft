-- Migration: Add apply_mode and glob_pattern columns to cursor_rules
-- Description: This migration adds support for specifying how and when cursor rules should be applied
-- Dependencies: Requires 008_create_cursor_rules.sql to be applied first

-- ============================================================================
-- STEP 1: Create apply_mode enum
-- ============================================================================

-- Create apply_mode enum for project rules
DO $$ BEGIN
    CREATE TYPE "apply_mode" AS ENUM ('always', 'intelligent', 'specific', 'manual');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- STEP 2: Add new columns to cursor_rules table
-- ============================================================================

-- Add apply_mode column (nullable, only used for PROJECT_RULE type)
ALTER TABLE "cursor_rules"
ADD COLUMN IF NOT EXISTS "apply_mode" "apply_mode";

-- Add glob_pattern column (nullable, only used when apply_mode is 'specific')
ALTER TABLE "cursor_rules"
ADD COLUMN IF NOT EXISTS "glob_pattern" TEXT;

-- Add comment to describe the purpose of these columns
COMMENT ON COLUMN "cursor_rules"."apply_mode" IS 'Specifies how the rule should be applied: always (every session), intelligent (AI decides), specific (matches glob pattern), manual (@-mentioned). Only used for PROJECT_RULE type.';
COMMENT ON COLUMN "cursor_rules"."glob_pattern" IS 'File pattern for matching when apply_mode is "specific". Examples: *.tsx, src/**/*.ts, package.json';

-- ============================================================================
-- STEP 3: Create index for glob_pattern queries (only for rules with specific apply_mode)
-- ============================================================================

-- Create partial index for rules that use glob patterns
CREATE INDEX IF NOT EXISTS "idx_cursor_rules_glob_pattern" 
ON "cursor_rules"("glob_pattern") 
WHERE "apply_mode" = 'specific' AND "deleted_at" IS NULL;

-- ============================================================================
-- STEP 4: Success Message
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Cursor Rules apply_mode migration completed successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Changes applied:';
    RAISE NOTICE '  ✓ Added apply_mode enum type with values: always, intelligent, specific, manual';
    RAISE NOTICE '  ✓ Added apply_mode column to cursor_rules table (nullable)';
    RAISE NOTICE '  ✓ Added glob_pattern column to cursor_rules table (nullable)';
    RAISE NOTICE '  ✓ Created partial index on glob_pattern for better query performance';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Usage:';
    RAISE NOTICE '  ✓ apply_mode: Specifies when/how the rule should be applied';
    RAISE NOTICE '    - always: Apply to every chat and cmd-k session';
    RAISE NOTICE '    - intelligent: AI decides based on context';
    RAISE NOTICE '    - specific: Apply when file matches glob_pattern';
    RAISE NOTICE '    - manual: Only when @-mentioned by user';
    RAISE NOTICE '  ✓ glob_pattern: File pattern for "specific" mode (e.g., *.tsx, src/**/*.ts)';
    RAISE NOTICE '';
    RAISE NOTICE '💡 Note: These fields are primarily used for PROJECT_RULE type rules';
    RAISE NOTICE '';
END $$;

