import type { Repository } from '@frontend/types/repository';

/**
 * Maps backend repository response to frontend Repository type
 */
export function mapToRepositoryDto(data: any): Repository {
  return {
    id: data.id,
    workspaceId: data.workspace_id,
    name: data.name,
    fullName: data.full_name,
    description: data.description,
    url: data.url,
    provider: data.provider,
    defaultBranch: data.default_branch,
    isPrivate: data.is_private,
    language: data.language,
    topics: data.topics || [],
    starsCount: data.stars_count,
    forksCount: data.forks_count,
    lastSyncedAt: data.last_synced_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Maps frontend add repository options to backend payload
 */
export function mapToAddRepositoryPayload(options: {
  workspaceId: string;
  name: string;
  fullName: string;
  description?: string;
  url: string;
  provider: string;
  defaultBranch: string;
  isPrivate: boolean;
  language?: string;
  topics?: string[];
  starsCount?: number;
  forksCount?: number;
}) {
  return {
    workspace_id: options.workspaceId,
    name: options.name,
    full_name: options.fullName,
    description: options.description,
    url: options.url,
    provider: options.provider,
    default_branch: options.defaultBranch,
    is_private: options.isPrivate,
    language: options.language,
    topics: options.topics,
    stars_count: options.starsCount,
    forks_count: options.forksCount,
  };
}

/**
 * Maps frontend update repository options to backend payload
 */
export function mapToUpdateRepositoryPayload(options: {
  name?: string;
  description?: string;
  defaultBranch?: string;
}) {
  return {
    name: options.name,
    description: options.description,
    default_branch: options.defaultBranch,
  };
}
