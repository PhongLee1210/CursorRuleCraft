import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import type { CreateRuleDto, UpdateRuleDto } from './cursor-rules.dto';
import type { CursorRule, RulesTreeResponse, RuleTreeNode } from './cursor-rules.types';
import { RuleType } from './cursor-rules.types';

/**
 * Cursor Rules Service
 *
 * Handles CRUD operations for cursor rules in repositories
 */
@Injectable()
export class CursorRulesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Get all rules for a repository
   * @param clerkToken - The Clerk session token
   * @param repositoryId - The repository ID
   * @returns Array of cursor rules
   */
  async getRules(clerkToken: string, repositoryId: string): Promise<CursorRule[]> {
    const supabase = this.supabaseService.getClientWithClerkToken(clerkToken);

    const { data, error } = await supabase
      .from('cursor_rules')
      .select('*')
      .eq('repository_id', repositoryId)
      .is('deleted_at', null) // Exclude soft-deleted rules
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch rules: ${error.message}`);
    }

    return data as CursorRule[];
  }

  /**
   * Get active rules for a repository
   * @param clerkToken - The Clerk session token
   * @param repositoryId - The repository ID
   * @returns Array of active cursor rules
   */
  async getActiveRules(clerkToken: string, repositoryId: string): Promise<CursorRule[]> {
    const supabase = this.supabaseService.getClientWithClerkToken(clerkToken);

    const { data, error } = await supabase
      .from('cursor_rules')
      .select('*')
      .eq('repository_id', repositoryId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch active rules: ${error.message}`);
    }

    return data as CursorRule[];
  }

  /**
   * Get a single rule by ID
   * @param clerkToken - The Clerk session token
   * @param ruleId - The rule ID
   * @returns Cursor rule
   */
  async getRuleById(clerkToken: string, ruleId: string): Promise<CursorRule> {
    const supabase = this.supabaseService.getClientWithClerkToken(clerkToken);

    const { data, error } = await supabase
      .from('cursor_rules')
      .select('*')
      .eq('id', ruleId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch rule: ${error.message}`);
    }

    if (!data) {
      throw new Error('Rule not found');
    }

    return data as CursorRule;
  }

  /**
   * Create a new rule
   * @param clerkToken - The Clerk session token
   * @param userId - The user ID from Clerk
   * @param repositoryId - The repository ID
   * @param dto - The rule creation data (file_name should NOT include extension)
   * @returns Created cursor rule
   *
   * Note: file_name should be the base name without extension.
   * Extensions (.rules.mdc for PROJECT_RULE, .md for COMMAND) are added
   * automatically when building the tree structure.
   */
  async createRule(
    clerkToken: string,
    userId: string,
    repositoryId: string,
    dto: CreateRuleDto
  ): Promise<CursorRule> {
    const supabase = this.supabaseService.getClientWithClerkToken(clerkToken);

    const { data, error } = await supabase
      .from('cursor_rules')
      .insert({
        repository_id: repositoryId,
        user_id: userId,
        type: dto.type,
        file_name: dto.file_name,
        content: dto.content,
        is_active: dto.is_active ?? false,
        current_version: 1,
        source_message_id: dto.source_message_id || null,
        apply_mode: dto.apply_mode || null,
        glob_pattern: dto.glob_pattern || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create rule: ${error.message}`);
    }

    return data as CursorRule;
  }

  /**
   * Update a rule
   * @param clerkToken - The Clerk session token
   * @param ruleId - The rule ID
   * @param dto - The rule update data
   * @returns Updated cursor rule
   */
  async updateRule(clerkToken: string, ruleId: string, dto: UpdateRuleDto): Promise<CursorRule> {
    const supabase = this.supabaseService.getClientWithClerkToken(clerkToken);

    const updateData: Record<string, unknown> = {};
    if (dto.file_name !== undefined) updateData.file_name = dto.file_name;
    if (dto.content !== undefined) updateData.content = dto.content;
    if (dto.is_active !== undefined) updateData.is_active = dto.is_active;

    const { data, error } = await supabase
      .from('cursor_rules')
      .update(updateData)
      .eq('id', ruleId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update rule: ${error.message}`);
    }

    return data as CursorRule;
  }

  /**
   * Delete a rule (soft delete)
   * @param clerkToken - The Clerk session token
   * @param ruleId - The rule ID
   */
  async deleteRule(clerkToken: string, ruleId: string): Promise<void> {
    const supabase = this.supabaseService.getClientWithClerkToken(clerkToken);

    // Soft delete by setting deleted_at timestamp
    const { error } = await supabase
      .from('cursor_rules')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', ruleId);

    if (error) {
      throw new Error(`Failed to delete rule: ${error.message}`);
    }
  }

  /**
   * Build virtual tree structure for cursor rules
   * Following the pattern from AI_AGENT_ARCHITECTURE.md
   *
   * Directory structure:
   * .cursor/
   *   rules/              <- PROJECT_RULE files (*.rules.mdc)
   *   commands/           <- COMMAND files (*.md)
   * .cursorrules          <- USER_RULE file (root level)
   *
   * @param clerkToken - The Clerk session token
   * @param repositoryId - The repository ID
   * @returns Virtual tree structure
   */
  async getRulesTree(clerkToken: string, repositoryId: string): Promise<RulesTreeResponse> {
    const rules = await this.getRules(clerkToken, repositoryId);

    // Separate rules by type (ONLY 3 TYPES)
    const projectRules = rules.filter((r) => r.type === RuleType.PROJECT_RULE);
    const commands = rules.filter((r) => r.type === RuleType.COMMAND);
    const userRules = rules.filter((r) => r.type === RuleType.USER_RULE);

    const children: RuleTreeNode[] = [];

    // Build .cursor directory
    const cursorChildren: RuleTreeNode[] = [];

    // Add rules directory (PROJECT_RULE files)
    if (projectRules.length > 0) {
      const rulesChildren: RuleTreeNode[] = projectRules.map((rule) =>
        this.buildFileNode(rule, 'rules')
      );

      cursorChildren.push({
        name: 'rules',
        type: 'directory',
        path: '.cursor/rules',
        children: rulesChildren,
      });
    }

    // Add commands directory (COMMAND files)
    if (commands.length > 0) {
      const commandsChildren: RuleTreeNode[] = commands.map((rule) =>
        this.buildFileNode(rule, 'commands')
      );

      cursorChildren.push({
        name: 'commands',
        type: 'directory',
        path: '.cursor/commands',
        children: commandsChildren,
      });
    }

    // Add .cursor directory if it has children
    if (cursorChildren.length > 0) {
      children.push({
        name: '.cursor',
        type: 'directory',
        path: '.cursor',
        children: cursorChildren,
      });
    }

    // Add .cursorrules file at root level (USER_RULE)
    userRules.forEach((rule) => {
      children.push({
        name: '.cursorrules',
        type: 'file',
        path: '.cursorrules',
        ruleId: rule.id,
        metadata: {
          file_name: rule.file_name,
          type: rule.type as RuleType,
          is_active: rule.is_active,
          created_at: rule.created_at,
          updated_at: rule.updated_at,
        },
      });
    });

    return {
      name: 'root',
      type: 'directory',
      path: '/',
      children,
    };
  }

  /**
   * Build a file node for the tree structure
   * @param rule - The cursor rule
   * @param directory - The parent directory name (rules or commands)
   * @returns File tree node
   */
  private buildFileNode(rule: CursorRule, directory: string): RuleTreeNode {
    // file_name is already normalized (lowercase, hyphens, no special chars)
    // Just add the appropriate extension based on type (ONLY 3 TYPES)
    let filename: string;
    if (rule.type === RuleType.PROJECT_RULE) {
      filename = `${rule.file_name}.rules.mdc`;
    } else if (rule.type === RuleType.COMMAND) {
      filename = `${rule.file_name}.md`;
    } else {
      // Fallback (shouldn't happen with proper type validation)
      filename = `${rule.file_name}.md`;
    }

    return {
      name: filename,
      type: 'file',
      path: `.cursor/${directory}/${filename}`,
      ruleId: rule.id,
      metadata: {
        file_name: rule.file_name,
        type: rule.type as RuleType,
        is_active: rule.is_active,
        created_at: rule.created_at,
        updated_at: rule.updated_at,
      },
    };
  }
}
