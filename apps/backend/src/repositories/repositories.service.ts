import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AddRepositoryDto, Repository, UpdateRepositoryDto } from './types/repository';
/**
 * Repositories Service
 *
 * This service manages repository entities in Supabase.
 * It handles CRUD operations for repositories connected to workspaces.
 */
@Injectable()
export class RepositoriesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Add a new repository to a workspace
   */
  async addRepository(clerkToken: string, data: AddRepositoryDto): Promise<Repository> {
    const client = this.supabaseService.getClientWithClerkToken(clerkToken);

    // Check if repository already exists in this workspace
    const { data: existing } = await client
      .from('repositories')
      .select('*')
      .eq('workspace_id', data.workspace_id)
      .eq('provider_repo_id', data.provider_repo_id)
      .single();

    if (existing) {
      throw new Error('Repository is already connected to this workspace');
    }

    const { data: repository, error } = await client
      .from('repositories')
      .insert(data)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add repository: ${error.message}`);
    }

    return repository;
  }

  /**
   * Get repository by ID
   */
  async getRepositoryById(clerkToken: string, repositoryId: string): Promise<Repository> {
    const client = this.supabaseService.getClientWithClerkToken(clerkToken);

    const { data, error } = await client
      .from('repositories')
      .select('*')
      .eq('id', repositoryId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Repository not found');
      }
      throw new Error(`Failed to fetch repository: ${error.message}`);
    }

    return data;
  }

  /**
   * Get all repositories for a workspace
   */
  async getWorkspaceRepositories(clerkToken: string, workspaceId: string): Promise<Repository[]> {
    const client = this.supabaseService.getClientWithClerkToken(clerkToken);

    const { data, error } = await client
      .from('repositories')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch repositories: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get repositories by git integration
   */
  async getRepositoriesByIntegration(
    clerkToken: string,
    gitIntegrationId: string
  ): Promise<Repository[]> {
    const client = this.supabaseService.getClientWithClerkToken(clerkToken);

    const { data, error } = await client
      .from('repositories')
      .select('*')
      .eq('git_integration_id', gitIntegrationId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch repositories: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Update repository information
   */
  async updateRepository(
    clerkToken: string,
    repositoryId: string,
    updates: UpdateRepositoryDto
  ): Promise<Repository> {
    const client = this.supabaseService.getClientWithClerkToken(clerkToken);

    const { data, error } = await client
      .from('repositories')
      .update(updates)
      .eq('id', repositoryId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update repository: ${error.message}`);
    }

    return data;
  }

  /**
   * Update repository sync status
   */
  async updateSyncStatus(
    clerkToken: string,
    repositoryId: string,
    status: 'idle' | 'syncing' | 'success' | 'error',
    error?: string
  ): Promise<Repository> {
    const client = this.supabaseService.getClientWithClerkToken(clerkToken);

    const updates: any = {
      sync_status: status,
      last_synced_at: new Date().toISOString(),
    };

    if (error) {
      updates.sync_error = error;
    } else {
      updates.sync_error = null;
    }

    const { data, error: updateError } = await client
      .from('repositories')
      .update(updates)
      .eq('id', repositoryId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update sync status: ${updateError.message}`);
    }

    return data;
  }

  /**
   * Delete repository
   */
  async deleteRepository(clerkToken: string, repositoryId: string): Promise<boolean> {
    const client = this.supabaseService.getClientWithClerkToken(clerkToken);

    const { error } = await client.from('repositories').delete().eq('id', repositoryId);

    if (error) {
      throw new Error(`Failed to delete repository: ${error.message}`);
    }

    return true;
  }

  /**
   * Check if a repository exists in a workspace
   */
  async repositoryExistsInWorkspace(
    clerkToken: string,
    workspaceId: string,
    providerRepoId: string
  ): Promise<boolean> {
    const client = this.supabaseService.getClientWithClerkToken(clerkToken);

    const { data, error } = await client
      .from('repositories')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('provider_repo_id', providerRepoId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to check repository existence: ${error.message}`);
    }

    return !!data;
  }

  /**
   * Sync repository metadata from Git provider
   * This is a placeholder that will be implemented with Git API integration
   */
  async syncRepositoryMetadata(clerkToken: string, repositoryId: string): Promise<Repository> {
    // Mark as syncing
    await this.updateSyncStatus(clerkToken, repositoryId, 'syncing');

    try {
      // TODO: Fetch latest metadata from Git provider API
      // For now, just mark as success
      return await this.updateSyncStatus(clerkToken, repositoryId, 'success');
    } catch (error) {
      await this.updateSyncStatus(
        clerkToken,
        repositoryId,
        'error',
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }
}
