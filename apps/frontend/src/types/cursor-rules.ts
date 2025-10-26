import type { ApplyMode, RuleType } from '@cursorrulecraft/shared-types';

/**
 * Cursor Rule entity
 */
export interface CursorRule {
  id: string;
  repository_id: string;
  user_id: string;
  source_message_id: string | null;
  type: RuleType;
  file_name: string; // Normalized filename (lowercase, hyphens, no special chars)
  content: string; // Rule content in any format (markdown, plain text, etc.)
  is_active: boolean;
  apply_mode?: ApplyMode; // How the rule should be applied (only for PROJECT_RULE)
  glob_pattern?: string; // File pattern for 'specific' apply mode
  current_version: number;
  deleted_at: string | null; // Soft delete timestamp
  created_at: string;
  updated_at: string;
}

/**
 * Tree node for displaying rules in a file tree structure
 */
export interface RuleTreeNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  ruleId?: string; // Only for files
  metadata?: {
    file_name: string;
    type: RuleType;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
  children?: RuleTreeNode[];
}

/**
 * Rules tree response
 */
export interface RulesTreeResponse {
  name: string;
  type: 'directory';
  path: string;
  children: RuleTreeNode[];
}

/**
 * Options for creating a new cursor rule
 */
export interface CreateCursorRuleOptions {
  file_name: string; // Normalized filename (lowercase, hyphens, no special chars)
  content: string;
  type: RuleType;
  is_active?: boolean;
  source_message_id?: string; // Optional AI chat message reference
  apply_mode?: ApplyMode; // How the rule should be applied (only for PROJECT_RULE)
  glob_pattern?: string; // File pattern for 'specific' apply mode
}

/**
 * Options for updating a cursor rule
 */
export interface UpdateCursorRuleOptions {
  file_name?: string;
  content?: string;
  is_active?: boolean;
  apply_mode?: ApplyMode;
  glob_pattern?: string;
}

/**
 * Result type for cursor rule operations
 */
export interface CursorRuleServiceResult<T> {
  data: T | null;
  error: Error | null;
}
