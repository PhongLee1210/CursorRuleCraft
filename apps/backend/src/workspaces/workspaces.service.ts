import { SupabaseService } from '@backend/supabase/supabase.service';
import { Injectable } from '@nestjs/common';

/**
 * Workspaces Service with Clerk Integration
 *
 * This service interacts with Supabase using Clerk session tokens.
 * All operations respect RLS policies based on the authenticated user.
 *
 * Note: User data is NOT stored in Supabase. Only user IDs (Clerk IDs) are stored.
 * To get user details (name, email, picture), fetch them from Clerk on the frontend.
 */
@Injectable()
export class WorkspacesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Get workspace by ID
   * Note: Returns owner_id (Clerk user ID). Fetch user details from Clerk on frontend.
   */
  async getWorkspaceById(clerkToken: string, workspaceId: string) {
    const client = this.supabaseService.getClientWithClerkToken(clerkToken);

    const { data, error } = await client
      .from('workspaces')
      .select('*')
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
   * Get all workspaces for the authenticated user (as owner or member)
   * Note: Returns only workspace data with owner_id. Fetch user details from Clerk on frontend.
   *
   * Auto-creates a default workspace if user has none.
   */
  async getUserWorkspaces(clerkToken: string) {
    const client = this.supabaseService.getClientWithClerkToken(clerkToken);

    // Get all workspace IDs where user is a member
    const { data: memberships, error: memberError } = await client
      .from('workspace_members')
      .select('workspace_id, role');

    if (memberError) {
      throw new Error(`Failed to fetch user workspaces: ${memberError.message}`);
    }

    // If user has no workspaces, return empty array
    // Workspaces are now created automatically via Clerk webhooks when users sign up
    if (!memberships || memberships.length === 0) {
      console.log(
        '[WorkspacesService] User has no workspaces. Workspaces are created automatically via webhooks.'
      );
      return [];
    }

    // Get full workspace details
    const workspaceIds = memberships.map((m) => m.workspace_id);
    const { data: workspaces, error: workspacesError } = await client
      .from('workspaces')
      .select('*')
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
   * Get workspaces owned by the authenticated user
   */
  async getOwnedWorkspaces(clerkToken: string) {
    const client = this.supabaseService.getClientWithClerkToken(clerkToken);

    const { data, error } = await client
      .from('workspaces')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch owned workspaces: ${error.message}`);
    }

    // RLS will automatically filter to only return workspaces owned by the authenticated user
    return data || [];
  }

  /**
   * Update workspace information
   */
  async updateWorkspace(clerkToken: string, workspaceId: string, updates: { name?: string }) {
    const client = this.supabaseService.getClientWithClerkToken(clerkToken);

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
  async deleteWorkspace(clerkToken: string, workspaceId: string) {
    const client = this.supabaseService.getClientWithClerkToken(clerkToken);

    const { error } = await client.from('workspaces').delete().eq('id', workspaceId);

    if (error) {
      throw new Error(`Failed to delete workspace: ${error.message}`);
    }

    return true;
  }

  /**
   * Get all members of a workspace
   * Note: Returns user_id and role only. Fetch user details from Clerk on frontend.
   */
  async getWorkspaceMembers(clerkToken: string, workspaceId: string) {
    const client = this.supabaseService.getClientWithClerkToken(clerkToken);

    const { data, error } = await client
      .from('workspace_members')
      .select('user_id, role')
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
    clerkToken: string,
    workspaceId: string,
    userId: string,
    role: 'OWNER' | 'ADMIN' | 'MEMBER' = 'MEMBER'
  ) {
    const client = this.supabaseService.getClientWithClerkToken(clerkToken);

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
      .select('user_id, role')
      .single();

    if (error) {
      throw new Error(`Failed to add member to workspace: ${error.message}`);
    }

    return data;
  }

  /**
   * Remove a member from a workspace
   */
  async removeWorkspaceMember(clerkToken: string, workspaceId: string, userId: string) {
    const client = this.supabaseService.getClientWithClerkToken(clerkToken);

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
    clerkToken: string,
    workspaceId: string,
    userId: string,
    role: 'OWNER' | 'ADMIN' | 'MEMBER'
  ) {
    const client = this.supabaseService.getClientWithClerkToken(clerkToken);

    const { data, error } = await client
      .from('workspace_members')
      .update({ role })
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .select('user_id, role')
      .single();

    if (error) {
      throw new Error(`Failed to update member role: ${error.message}`);
    }

    return data;
  }

  /**
   * Get the authenticated user's role in a workspace
   */
  async getUserRoleInWorkspace(
    clerkToken: string,
    workspaceId: string
  ): Promise<'OWNER' | 'ADMIN' | 'MEMBER' | null> {
    const client = this.supabaseService.getClientWithClerkToken(clerkToken);

    const { data, error } = await client
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
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
   * Get a specific user's role in a workspace (admin check)
   */
  async getSpecificUserRoleInWorkspace(
    clerkToken: string,
    workspaceId: string,
    userId: string
  ): Promise<'OWNER' | 'ADMIN' | 'MEMBER' | null> {
    const client = this.supabaseService.getClientWithClerkToken(clerkToken);

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
   * Check if authenticated user has access to a workspace
   */
  async hasWorkspaceAccess(clerkToken: string, workspaceId: string): Promise<boolean> {
    const role = await this.getUserRoleInWorkspace(clerkToken, workspaceId);
    return role !== null;
  }

  /**
   * Check if authenticated user is an owner or admin of a workspace
   */
  async isWorkspaceAdmin(clerkToken: string, workspaceId: string): Promise<boolean> {
    const role = await this.getUserRoleInWorkspace(clerkToken, workspaceId);
    return role === 'OWNER' || role === 'ADMIN';
  }

  /**
   * Check if authenticated user is the owner of a workspace
   */
  async isWorkspaceOwner(clerkToken: string, workspaceId: string): Promise<boolean> {
    const role = await this.getUserRoleInWorkspace(clerkToken, workspaceId);
    return role === 'OWNER';
  }
}
