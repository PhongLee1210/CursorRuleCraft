import { SupabaseService } from '@backend/supabase/supabase.service';
import { verifyWebhook } from '@clerk/backend/webhooks';
import { Injectable } from '@nestjs/common';
import type { Request } from 'express';

// Import Clerk webhook types
type ClerkWebhookEvent = Awaited<ReturnType<typeof verifyWebhook>>;

/**
 * Type guard to check if event is a user event
 */
function isUserEvent(event: ClerkWebhookEvent): boolean {
  return (
    event.type === 'user.created' || event.type === 'user.updated' || event.type === 'user.deleted'
  );
}

/**
 * Webhooks Service
 *
 * Handles incoming webhooks from Clerk for automatic workspace creation.
 * Verifies webhook signatures and processes user events.
 */
@Injectable()
export class WebhooksService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Verify webhook signature and parse payload
   */
  async verifyWebhook(request: Request, secret: string): Promise<ClerkWebhookEvent> {
    try {
      // Use Clerk's verifyWebhook function with the full Request object
      const event = await verifyWebhook(request as any, {
        signingSecret: secret,
      });

      return event;
    } catch (error) {
      console.error('[WebhooksService] Webhook verification failed:', error);
      throw new Error('Invalid webhook signature');
    }
  }

  /**
   * Handle user.created event
   * Automatically creates a workspace for new users
   */
  async handleUserCreated(event: ClerkWebhookEvent): Promise<void> {
    if (event.type !== 'user.created') {
      throw new Error(`Expected user.created event, got ${event.type}`);
    }

    const userData = event.data;
    const userId = userData.id;
    const primaryEmail = userData.email_addresses[0]?.email_address;

    console.log(`[WebhooksService] Processing user.created for ${userId} (${primaryEmail})`);

    try {
      // Create a Supabase client with service role key (bypasses RLS for admin operations)
      const client = this.supabaseService.getServiceRoleClient();

      // Check if user already has any workspaces
      const { data: existingWorkspaces } = await client.from('workspaces').select('id').limit(1);

      // If user already has workspaces, skip creation
      if (existingWorkspaces && existingWorkspaces.length > 0) {
        console.log(`[WebhooksService] User ${userId} already has workspaces, skipping creation`);
        return;
      }

      // Generate a default workspace name based on user's name or email
      let workspaceName = 'My Workspace';
      if (userData.first_name || userData.last_name) {
        workspaceName = `${userData.first_name || ''} ${userData.last_name || ''}`.trim();
        if (!workspaceName) workspaceName = 'My Workspace';
      } else if (primaryEmail) {
        const emailPrefix = primaryEmail.split('@')[0];
        workspaceName = `${emailPrefix}'s Workspace`;
      }

      console.log(`[WebhooksService] Creating workspace "${workspaceName}" for user ${userId}`);

      // Create the workspace using service role (bypasses RLS)
      const { data: workspace, error: workspaceError } = await client
        .from('workspaces')
        .insert({
          name: workspaceName,
          owner_id: userId,
        })
        .select()
        .single();

      if (workspaceError) {
        console.error('[WebhooksService] Failed to create workspace:', workspaceError);
        throw new Error(`Failed to create workspace: ${workspaceError.message}`);
      }

      // Add the user as OWNER member
      const { error: memberError } = await client.from('workspace_members').insert({
        workspace_id: workspace.id,
        user_id: userId,
        role: 'OWNER',
      });

      if (memberError) {
        console.error('[WebhooksService] Failed to add user to workspace:', memberError);
        // Try to rollback workspace creation
        await client.from('workspaces').delete().eq('id', workspace.id);
        throw new Error(`Failed to add user to workspace: ${memberError.message}`);
      }

      console.log(
        `[WebhooksService] Successfully created workspace ${workspace.id} for user ${userId}`
      );
    } catch (error) {
      console.error('[WebhooksService] Error creating workspace for user:', error);
      // Don't throw here - we don't want webhook failures to retry indefinitely
      // The user can still manually create a workspace if auto-creation fails
    }
  }

  /**
   * Handle user.updated event
   * Currently just logs the event, but could be extended for profile updates
   */
  async handleUserUpdated(event: ClerkWebhookEvent): Promise<void> {
    if (event.type !== 'user.updated') {
      throw new Error(`Expected user.updated event, got ${event.type}`);
    }

    const userData = event.data;
    const userId = userData.id;
    console.log(`[WebhooksService] Processing user.updated for ${userId}`);

    // For now, just log the update
    // In the future, this could be used to:
    // - Update workspace names based on user name changes
    // - Handle email verification status changes
    // - Update user metadata

    console.log(`[WebhooksService] User ${userId} updated - no action taken`);
  }

  /**
   * Handle user.deleted event
   * Automatically cleans up workspaces owned by the deleted user
   */
  async handleUserDeleted(event: ClerkWebhookEvent): Promise<void> {
    if (event.type !== 'user.deleted') {
      throw new Error(`Expected user.deleted event, got ${event.type}`);
    }

    // Type assertion for user.deleted event
    if (!isUserEvent(event)) {
      throw new Error(`Invalid user event type: ${event.type}`);
    }

    const userData = event.data;
    const userId = userData.id;

    // For deleted users, email_addresses are not available in DeletedObjectJSON
    const primaryEmail = 'unknown (deleted user)';

    console.log(`[WebhooksService] Processing user.deleted for ${userId} (${primaryEmail})`);

    try {
      // Create a Supabase client with service role key (bypasses RLS for admin operations)
      const client = this.supabaseService.getServiceRoleClient();

      // Find all workspaces owned by this user
      const { data: ownedWorkspaces, error: fetchError } = await client
        .from('workspaces')
        .select('id, name')
        .eq('owner_id', userId);

      if (fetchError) {
        console.error('[WebhooksService] Failed to fetch owned workspaces:', fetchError);
        throw new Error(`Failed to fetch owned workspaces: ${fetchError.message}`);
      }

      if (!ownedWorkspaces || ownedWorkspaces.length === 0) {
        console.log(`[WebhooksService] User ${userId} had no owned workspaces to delete`);
        return;
      }

      console.log(
        `[WebhooksService] Found ${ownedWorkspaces.length} workspace(s) owned by user ${userId}:`
      );
      ownedWorkspaces.forEach((workspace) => {
        console.log(`  - ${workspace.name} (${workspace.id})`);
      });

      // Due to CASCADE DELETE constraints in the database:
      // - Deleting workspaces will automatically delete:
      //   - workspace_members (all members)
      //   - repositories (all connected repos)
      //   - git_integrations (user's Git integrations used by those repos)
      // - Deleting the user will also automatically delete:
      //   - Any remaining workspace_members entries for this user
      //   - Any remaining git_integrations for this user

      // Delete workspaces owned by this user (cascade will handle the rest)
      const workspaceIds = ownedWorkspaces.map((w) => w.id);
      const { error: deleteError } = await client
        .from('workspaces')
        .delete()
        .in('id', workspaceIds);

      if (deleteError) {
        console.error('[WebhooksService] Failed to delete owned workspaces:', deleteError);
        throw new Error(`Failed to delete owned workspaces: ${deleteError.message}`);
      }

      console.log(
        `[WebhooksService] Successfully deleted ${ownedWorkspaces.length} workspace(s) owned by user ${userId}`
      );
    } catch (error) {
      console.error('[WebhooksService] Error handling user deletion:', error);
      // Don't throw here - we don't want webhook failures to retry indefinitely
      // The database cascade deletes should still work even if our handler fails
    }
  }
}
