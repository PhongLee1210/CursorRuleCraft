import type { ApiClient } from '@frontend/lib/api-client';
import type {
  CreateCursorRuleOptions,
  CursorRule,
  CursorRuleServiceResult,
  RulesTreeResponse,
  UpdateCursorRuleOptions,
} from '@frontend/types/cursor-rules';

/**
 * Get cursor rules tree for a repository
 */
export async function getCursorRulesTree(
  apiClient: ApiClient,
  repositoryId: string
): Promise<CursorRuleServiceResult<RulesTreeResponse>> {
  try {
    const response = await apiClient.get<{ data: RulesTreeResponse }>(
      `/repositories/${repositoryId}/rules/tree`
    );

    if (response.error) {
      console.error('[CursorRulesService] Error fetching rules tree:', response.error);
      return {
        data: null,
        error: response.error,
      };
    }

    return {
      data: response.data!.data,
      error: null,
    };
  } catch (error) {
    console.error('[CursorRulesService] Unexpected error fetching rules tree:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error occurred'),
    };
  }
}

/**
 * Get all cursor rules for a repository
 */
export async function getCursorRules(
  apiClient: ApiClient,
  repositoryId: string,
  activeOnly?: boolean
): Promise<CursorRuleServiceResult<CursorRule[]>> {
  try {
    const url = activeOnly
      ? `/repositories/${repositoryId}/rules?active=true`
      : `/repositories/${repositoryId}/rules`;

    const response = await apiClient.get<{ data: CursorRule[] }>(url);

    if (response.error) {
      console.error('[CursorRulesService] Error fetching rules:', response.error);
      return {
        data: null,
        error: response.error,
      };
    }

    return {
      data: response.data!.data,
      error: null,
    };
  } catch (error) {
    console.error('[CursorRulesService] Unexpected error fetching rules:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error occurred'),
    };
  }
}

/**
 * Get a single cursor rule by ID
 */
export async function getCursorRuleById(
  apiClient: ApiClient,
  repositoryId: string,
  ruleId: string
): Promise<CursorRuleServiceResult<CursorRule>> {
  try {
    const response = await apiClient.get<{ data: CursorRule }>(
      `/repositories/${repositoryId}/rules/${ruleId}`
    );

    if (response.error) {
      console.error('[CursorRulesService] Error fetching rule:', response.error);
      return {
        data: null,
        error: response.error,
      };
    }

    return {
      data: response.data!.data,
      error: null,
    };
  } catch (error) {
    console.error('[CursorRulesService] Unexpected error fetching rule:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error occurred'),
    };
  }
}

/**
 * Create a new cursor rule
 */
export async function createCursorRule(
  apiClient: ApiClient,
  repositoryId: string,
  options: CreateCursorRuleOptions
): Promise<CursorRuleServiceResult<CursorRule>> {
  try {
    const response = await apiClient.post<{ data: CursorRule }>(
      `/repositories/${repositoryId}/rules`,
      options
    );

    if (response.error) {
      console.error('[CursorRulesService] Error creating rule:', response.error);
      return {
        data: null,
        error: response.error,
      };
    }

    return {
      data: response.data!.data,
      error: null,
    };
  } catch (error) {
    console.error('[CursorRulesService] Unexpected error creating rule:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error occurred'),
    };
  }
}

/**
 * Update a cursor rule
 */
export async function updateCursorRule(
  apiClient: ApiClient,
  repositoryId: string,
  ruleId: string,
  options: UpdateCursorRuleOptions
): Promise<CursorRuleServiceResult<CursorRule>> {
  try {
    const response = await apiClient.put<{ data: CursorRule }>(
      `/repositories/${repositoryId}/rules/${ruleId}`,
      options
    );

    if (response.error) {
      console.error('[CursorRulesService] Error updating rule:', response.error);
      return {
        data: null,
        error: response.error,
      };
    }

    return {
      data: response.data!.data,
      error: null,
    };
  } catch (error) {
    console.error('[CursorRulesService] Unexpected error updating rule:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error occurred'),
    };
  }
}

/**
 * Delete a cursor rule
 */
export async function deleteCursorRule(
  apiClient: ApiClient,
  repositoryId: string,
  ruleId: string
): Promise<CursorRuleServiceResult<boolean>> {
  try {
    const response = await apiClient.delete<{ success: boolean }>(
      `/repositories/${repositoryId}/rules/${ruleId}`
    );

    if (response.error) {
      console.error('[CursorRulesService] Error deleting rule:', response.error);
      return {
        data: null,
        error: response.error,
      };
    }

    return {
      data: true,
      error: null,
    };
  } catch (error) {
    console.error('[CursorRulesService] Unexpected error deleting rule:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error occurred'),
    };
  }
}
