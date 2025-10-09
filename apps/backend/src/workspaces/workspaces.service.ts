import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

/**
 * Workspaces Service
 *
 * This service interacts with Supabase using the Service Role Key.
 * All operations here bypass RLS policies.
 */
@Injectable()
export class WorkspacesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Create a new workspace and add the owner as a member with OWNER role
   */
  async createWorkspace(ownerId: string, name: string) {
    const client = this.supabaseService.getClient();

    // Create the workspace
    const { data: workspace, error: workspaceError } = await client
      .from('workspaces')
      .insert({ owner_id: ownerId, name })
      .select()
      .single();

    if (workspaceError) {
      throw new Error(`Failed to create workspace: ${workspaceError.message}`);
    }

    // Add owner as a member with OWNER role
    const { error: memberError } = await client.from('workspace_members').insert({
      workspace_id: workspace.id,
      user_id: ownerId,
      role: 'OWNER',
    });

    if (memberError) {
      // Rollback: delete the workspace if member insertion fails
      await client.from('workspaces').delete().eq('id', workspace.id);
      throw new Error(`Failed to add owner to workspace: ${memberError.message}`);
    }

    return workspace;
  }

  /**
   * Get workspace by ID with owner information
   */
  async getWorkspaceById(workspaceId: string) {
    const client = this.supabaseService.getClient();

    const { data, error } = await client
      .from('workspaces')
      .select(
        `
        *,
        owner:owner_id (id, name, email, picture, username)
      `
      )
      .eq('id', workspaceId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Workspace not found');
      }
      throw new Error(`Failed to fetch workspace: ${error.message}`);
    }

    return data;
  }

  /**
   * Get all workspaces for a user (as owner or member)
   */
  async getUserWorkspaces(userId: string) {
    const client = this.supabaseService.getClient();

    // Get all workspace IDs where user is a member
    const { data: memberships, error: memberError } = await client
      .from('workspace_members')
      .select('workspace_id, role')
      .eq('user_id', userId);

    if (memberError) {
      throw new Error(`Failed to fetch user workspaces: ${memberError.message}`);
    }

    if (!memberships || memberships.length === 0) {
      return [];
    }

    // Get full workspace details
    const workspaceIds = memberships.map((m) => m.workspace_id);
    const { data: workspaces, error: workspacesError } = await client
      .from('workspaces')
      .select(
        `
        *,
        owner:owner_id (id, name, email, picture, username)
      `
      )
      .in('id', workspaceIds)
      .order('created_at', { ascending: false });

    if (workspacesError) {
      throw new Error(`Failed to fetch workspaces: ${workspacesError.message}`);
    }

    // Merge role information with workspaces
    return workspaces.map((workspace) => {
      const membership = memberships.find((m) => m.workspace_id === workspace.id);
      return {
        ...workspace,
        userRole: membership?.role || 'MEMBER',
      };
    });
  }

  /**
   * Get workspaces owned by a specific user
   */
  async getOwnedWorkspaces(userId: string) {
    const client = this.supabaseService.getClient();

    const { data, error } = await client
      .from('workspaces')
      .select(
        `
        *,
        owner:owner_id (id, name, email, picture, username)
      `
      )
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch owned workspaces: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Update workspace information
   */
  async updateWorkspace(workspaceId: string, updates: { name?: string }) {
    const client = this.supabaseService.getClient();

    const { data, error } = await client
      .from('workspaces')
      .update(updates)
      .eq('id', workspaceId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update workspace: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete workspace (will cascade delete all members)
   */
  async deleteWorkspace(workspaceId: string) {
    const client = this.supabaseService.getClient();

    const { error } = await client.from('workspaces').delete().eq('id', workspaceId);

    if (error) {
      throw new Error(`Failed to delete workspace: ${error.message}`);
    }

    return true;
  }

  /**
   * Get all members of a workspace
   */
  async getWorkspaceMembers(workspaceId: string) {
    const client = this.supabaseService.getClient();

    const { data, error } = await client
      .from('workspace_members')
      .select(
        `
        role,
        user:user_id (id, name, email, picture, username)
      `
      )
      .eq('workspace_id', workspaceId);

    if (error) {
      throw new Error(`Failed to fetch workspace members: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Add a member to a workspace
   */
  async addWorkspaceMember(
    workspaceId: string,
    userId: string,
    role: 'OWNER' | 'ADMIN' | 'MEMBER' = 'MEMBER'
  ) {
    const client = this.supabaseService.getClient();

    // Check if member already exists
    const { data: existing } = await client
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      throw new Error('User is already a member of this workspace');
    }

    const { data, error } = await client
      .from('workspace_members')
      .insert({
        workspace_id: workspaceId,
        user_id: userId,
        role,
      })
      .select(
        `
        role,
        user:user_id (id, name, email, picture, username)
      `
      )
      .single();

    if (error) {
      throw new Error(`Failed to add member to workspace: ${error.message}`);
    }

    return data;
  }

  /**
   * Remove a member from a workspace
   */
  async removeWorkspaceMember(workspaceId: string, userId: string) {
    const client = this.supabaseService.getClient();

    const { error } = await client
      .from('workspace_members')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to remove member from workspace: ${error.message}`);
    }

    return true;
  }

  /**
   * Update a member's role in a workspace
   */
  async updateWorkspaceMemberRole(
    workspaceId: string,
    userId: string,
    role: 'OWNER' | 'ADMIN' | 'MEMBER'
  ) {
    const client = this.supabaseService.getClient();

    const { data, error } = await client
      .from('workspace_members')
      .update({ role })
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .select(
        `
        role,
        user:user_id (id, name, email, picture, username)
      `
      )
      .single();

    if (error) {
      throw new Error(`Failed to update member role: ${error.message}`);
    }

    return data;
  }

  /**
   * Get a user's role in a workspace
   */
  async getUserRoleInWorkspace(
    workspaceId: string,
    userId: string
  ): Promise<'OWNER' | 'ADMIN' | 'MEMBER' | null> {
    const client = this.supabaseService.getClient();

    const { data, error } = await client
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch user role: ${error.message}`);
    }

    return data.role;
  }

  /**
   * Check if a user has access to a workspace
   */
  async hasWorkspaceAccess(workspaceId: string, userId: string): Promise<boolean> {
    const role = await this.getUserRoleInWorkspace(workspaceId, userId);
    return role !== null;
  }

  /**
   * Check if a user is an owner or admin of a workspace
   */
  async isWorkspaceAdmin(workspaceId: string, userId: string): Promise<boolean> {
    const role = await this.getUserRoleInWorkspace(workspaceId, userId);
    return role === 'OWNER' || role === 'ADMIN';
  }

  /**
   * Check if a user is the owner of a workspace
   */
  async isWorkspaceOwner(workspaceId: string, userId: string): Promise<boolean> {
    const role = await this.getUserRoleInWorkspace(workspaceId, userId);
    return role === 'OWNER';
  }
}
