/**
 * Cursor Rules Types
 *
 * Types and DTOs for cursor rules management
 * Schema follows AI_AGENT_ARCHITECTURE.md specification
 */

export enum RuleType {
  PROJECT_RULE = 'PROJECT_RULE',
  USER_RULE = 'USER_RULE',
  COMMAND = 'COMMAND',
}

export type ApplyMode = 'always' | 'intelligent' | 'specific' | 'manual';

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

export interface CreateRuleDto {
  file_name: string; // Normalized filename (lowercase, hyphens, no special chars)
  content: string;
  type: RuleType;
  is_active?: boolean;
  source_message_id?: string; // Optional AI chat message reference
  apply_mode?: ApplyMode; // How the rule should be applied (only for PROJECT_RULE)
  glob_pattern?: string; // File pattern for 'specific' apply mode
}

export interface UpdateRuleDto {
  file_name?: string;
  content?: string;
  is_active?: boolean;
}

export interface RuleTreeNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  ruleId?: string;
  metadata?: {
    file_name: string;
    type: RuleType;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
  children?: RuleTreeNode[];
}

export interface RulesTreeResponse {
  name: string;
  type: 'directory';
  path: string;
  children: RuleTreeNode[];
}
