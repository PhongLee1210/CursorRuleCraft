import { useApiClient } from '@/lib/api-client';
import {
  createCursorRule,
  deleteCursorRule,
  getCursorRuleById,
  getCursorRules,
  getCursorRulesTree,
  updateCursorRule,
} from '@/services/cursor-rules/cursor-rules';
import type {
  CreateCursorRuleOptions,
  CursorRule,
  CursorRuleServiceResult,
  RuleTreeNode,
  UpdateCursorRuleOptions,
} from '@/types/cursor-rules';
import { useCallback, useMemo } from 'react';

/**
 * Hook for managing cursor rules
 */
export function useCursorRules() {
  const apiClient = useApiClient();

  const getRulesTree = useCallback(
    async (repositoryId: string): Promise<CursorRuleServiceResult<RuleTreeNode>> => {
      return getCursorRulesTree(apiClient, repositoryId);
    },
    [apiClient]
  );

  const getRules = useCallback(
    async (repositoryId: string): Promise<CursorRuleServiceResult<CursorRule[]>> => {
      return getCursorRules(apiClient, repositoryId);
    },
    [apiClient]
  );

  const getRuleById = useCallback(
    async (ruleId: string, repositoryId: string): Promise<CursorRuleServiceResult<CursorRule>> => {
      return getCursorRuleById(apiClient, repositoryId, ruleId);
    },
    [apiClient]
  );

  const createRule = useCallback(
    async (
      repositoryId: string,
      options: CreateCursorRuleOptions
    ): Promise<CursorRuleServiceResult<CursorRule>> => {
      return createCursorRule(apiClient, repositoryId, options);
    },
    [apiClient]
  );

  const updateRule = useCallback(
    async (
      repositoryId: string,
      ruleId: string,
      options: UpdateCursorRuleOptions
    ): Promise<CursorRuleServiceResult<CursorRule>> => {
      return updateCursorRule(apiClient, repositoryId, ruleId, options);
    },
    [apiClient]
  );

  const deleteRule = useCallback(
    async (repositoryId: string, ruleId: string): Promise<CursorRuleServiceResult<boolean>> => {
      return deleteCursorRule(apiClient, repositoryId, ruleId);
    },
    [apiClient]
  );

  return useMemo(
    () => ({
      getRulesTree,
      getRules,
      getRuleById,
      createRule,
      updateRule,
      deleteRule,
    }),
    [getRulesTree, getRules, getRuleById, createRule, updateRule, deleteRule]
  );
}
