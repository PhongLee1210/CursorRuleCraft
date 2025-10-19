-- ============================================================================
-- Migration: Add AI Model Settings
-- ============================================================================
-- This migration adds support for storing AI model preferences and usage tracking
-- 
-- SECURITY NOTE: This stores model PREFERENCES, NOT API keys!
-- API keys must ALWAYS remain in environment variables only.
-- 
-- What we store:
--   ✅ Model name (e.g., 'llama-3.3-70b-versatile')
--   ✅ Provider (e.g., 'groq', 'openai')
--   ✅ Model parameters (temperature, maxTokens)
--   ✅ Usage statistics (tokens, costs)
-- 
-- What we DO NOT store:
--   ❌ API keys
--   ❌ Access tokens
--   ❌ Any authentication credentials
-- ============================================================================

-- ============================================================================
-- 1. User AI Preferences (per user, across all workspaces)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_ai_preferences (
    user_id TEXT PRIMARY KEY, -- Clerk user ID from JWT
    
    -- Default model preferences
    default_provider TEXT NOT NULL DEFAULT 'groq', -- 'groq', 'openai', etc.
    default_model TEXT NOT NULL DEFAULT 'llama-3.3-70b-versatile',
    default_temperature NUMERIC(3,2) DEFAULT 0.7 CHECK (default_temperature >= 0 AND default_temperature <= 2),
    default_max_tokens INTEGER CHECK (default_max_tokens > 0 AND default_max_tokens <= 100000),
    
    -- Usage tracking (for cost management and analytics)
    total_tokens_used BIGINT DEFAULT 0,
    total_requests_count BIGINT DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for efficient lookups
CREATE INDEX idx_user_ai_preferences_user_id ON user_ai_preferences(user_id);

-- Add comment
COMMENT ON TABLE user_ai_preferences IS 'User-level AI model preferences. Stores preferences ONLY, never API keys.';

-- ============================================================================
-- 2. Update repository_ai_sessions to include model settings
-- ============================================================================
-- Extend the existing context_snapshot to include model configuration
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'repository_ai_sessions'
        AND column_name = 'context_snapshot'
    ) THEN
        COMMENT ON COLUMN repository_ai_sessions.context_snapshot IS 
        'Session context including model settings. Example:
        {
          "model": {
            "provider": "groq",
            "model": "llama-3.3-70b-versatile",
            "temperature": 0.7,
            "maxTokens": 2000
          },
          "repository_context": { ... },
          "conversation_context": { ... }
        }';
    END IF;
END $$;

-- ============================================================================
-- 3. Update ai_chat_messages metadata to include model info
-- ============================================================================
-- Extend the existing metadata to track which model was used
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ai_chat_messages'
        AND column_name = 'metadata'
    ) THEN
        COMMENT ON COLUMN ai_chat_messages.metadata IS 
        'Message metadata including model used. Example:
        {
          "model": {
            "provider": "groq",
            "model": "llama-3.3-70b-versatile",
            "temperature": 0.7
          },
          "tokens": {
            "prompt": 150,
            "completion": 450,
            "total": 600
          },
          "cost_estimate": 0.0012,
          "finish_reason": "stop",
          "generation_time_ms": 1250
        }';
    END IF;
END $$;

-- ============================================================================
-- 4. Create AI Usage Statistics Table (for cost tracking and analytics)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_usage_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL, -- Clerk user ID from JWT
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
    session_id UUID REFERENCES repository_ai_sessions(id) ON DELETE CASCADE,
    message_id UUID REFERENCES ai_chat_messages(id) ON DELETE CASCADE,
    
    -- Model information (what was used)
    provider TEXT NOT NULL, -- 'groq', 'openai', etc.
    model TEXT NOT NULL, -- 'llama-3.3-70b-versatile', etc.
    
    -- Usage details
    prompt_tokens INTEGER NOT NULL DEFAULT 0,
    completion_tokens INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    
    -- Cost estimation (if available)
    estimated_cost NUMERIC(10,6), -- In USD
    
    -- Performance metrics
    generation_time_ms INTEGER, -- How long it took
    
    -- Timestamp
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for analytics queries
CREATE INDEX idx_ai_usage_user_id ON ai_usage_statistics(user_id);
CREATE INDEX idx_ai_usage_workspace_id ON ai_usage_statistics(workspace_id);
CREATE INDEX idx_ai_usage_repository_id ON ai_usage_statistics(repository_id);
CREATE INDEX idx_ai_usage_created_at ON ai_usage_statistics(created_at);
CREATE INDEX idx_ai_usage_provider_model ON ai_usage_statistics(provider, model);

-- Add comment
COMMENT ON TABLE ai_usage_statistics IS 'Track AI usage for cost management and analytics. Does NOT store API keys.';

-- ============================================================================
-- 5. Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE user_ai_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_statistics ENABLE ROW LEVEL SECURITY;

-- user_ai_preferences policies
CREATE POLICY "Users can view own AI preferences"
    ON user_ai_preferences FOR SELECT
    USING (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Users can insert own AI preferences"
    ON user_ai_preferences FOR INSERT
    WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Users can update own AI preferences"
    ON user_ai_preferences FOR UPDATE
    USING (user_id = (auth.jwt() ->> 'sub'))
    WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Users can delete own AI preferences"
    ON user_ai_preferences FOR DELETE
    USING (user_id = (auth.jwt() ->> 'sub'));

-- ai_usage_statistics policies
CREATE POLICY "Users can view own usage statistics"
    ON ai_usage_statistics FOR SELECT
    USING (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Users can insert own usage statistics"
    ON ai_usage_statistics FOR INSERT
    WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

-- Workspace members can view workspace usage statistics
CREATE POLICY "Workspace members can view workspace usage"
    ON ai_usage_statistics FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id = ai_usage_statistics.workspace_id
            AND workspace_members.user_id = (auth.jwt() ->> 'sub')
        )
    );

-- ============================================================================
-- 6. Helper Functions
-- ============================================================================

-- Function to get or create user AI preferences with defaults
CREATE OR REPLACE FUNCTION get_or_create_user_ai_preferences(p_user_id TEXT)
RETURNS user_ai_preferences
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_preferences user_ai_preferences;
BEGIN
    -- Try to get existing preferences
    SELECT * INTO v_preferences
    FROM user_ai_preferences
    WHERE user_id = p_user_id;
    
    -- If not found, create with defaults
    IF NOT FOUND THEN
        INSERT INTO user_ai_preferences (user_id)
        VALUES (p_user_id)
        RETURNING * INTO v_preferences;
    END IF;
    
    RETURN v_preferences;
END;
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_ai_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER user_ai_preferences_updated_at
    BEFORE UPDATE ON user_ai_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_user_ai_preferences_updated_at();

-- ============================================================================
-- 7. Sample Queries (for documentation purposes)
-- ============================================================================

-- Get user's AI preferences
-- SELECT * FROM user_ai_preferences WHERE user_id = 'user_abc123';

-- Track AI usage
-- INSERT INTO ai_usage_statistics (user_id, provider, model, prompt_tokens, completion_tokens, total_tokens)
-- VALUES ('user_abc123', 'groq', 'llama-3.3-70b-versatile', 150, 450, 600);

-- Get usage statistics for last 30 days
-- SELECT 
--     provider,
--     model,
--     COUNT(*) as request_count,
--     SUM(total_tokens) as total_tokens,
--     SUM(estimated_cost) as total_cost
-- FROM ai_usage_statistics
-- WHERE user_id = 'user_abc123'
-- AND created_at >= NOW() - INTERVAL '30 days'
-- GROUP BY provider, model
-- ORDER BY total_tokens DESC;

-- Get workspace usage statistics
-- SELECT 
--     u.user_id,
--     COUNT(*) as request_count,
--     SUM(u.total_tokens) as total_tokens
-- FROM ai_usage_statistics u
-- WHERE u.workspace_id = 'workspace-uuid'
-- AND u.created_at >= NOW() - INTERVAL '7 days'
-- GROUP BY u.user_id;

