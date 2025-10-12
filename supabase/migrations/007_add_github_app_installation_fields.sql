-- Add GitHub App Installation fields to git_integrations table
-- This migration adds support for GitHub App installation tokens,
-- which are more reliable than OAuth tokens

-- Add new columns for GitHub App installation authentication
ALTER TABLE git_integrations
ADD COLUMN IF NOT EXISTS installation_id INTEGER,
ADD COLUMN IF NOT EXISTS installation_token_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS auth_type TEXT DEFAULT 'oauth' CHECK (auth_type IN ('oauth', 'installation'));

-- Create index on installation_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_git_integrations_installation_id 
ON git_integrations(installation_id) 
WHERE installation_id IS NOT NULL;

-- Add comment explaining the fields
COMMENT ON COLUMN git_integrations.installation_id IS 
  'GitHub App installation ID - used to generate installation tokens programmatically';

COMMENT ON COLUMN git_integrations.installation_token_expires_at IS 
  'When the current installation token expires (typically 1 hour from generation). Token will be auto-regenerated when expired.';

COMMENT ON COLUMN git_integrations.auth_type IS 
  'Type of authentication: oauth (user OAuth token) or installation (GitHub App installation token)';

