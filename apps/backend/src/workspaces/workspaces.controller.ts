import { ClerkToken } from '@/auth/decorators/clerk-token.decorator';
import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';

/**
 * Workspaces Controller
 *
 * This controller provides endpoints for workspace management.
 * All endpoints are protected by the ClerkAuthGuard (applied globally).
 */
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  /**
   * Create a new workspace
   *
   * Example request:
   * POST /api/workspaces
   * Headers: { Authorization: "Bearer <clerk-jwt-token>" }
   * Body: { name: "My Workspace" }
   */
  @Post()
  async createWorkspace(@ClerkToken() clerkToken: string, @Body('name') name: string) {
    if (!name || name.trim().length === 0) {
      throw new Error('Workspace name is required');
    }

    const workspace = await this.workspacesService.createWorkspace(clerkToken, name.trim());

    return {
      message: 'Successfully created workspace',
      data: workspace,
    };
  }

  /**
   * Get all workspaces for the current user
   *
   * Example request:
   * GET /api/workspaces
   * Headers: { Authorization: "Bearer <clerk-jwt-token>" }
   */
  @Get()
  async getUserWorkspaces(@ClerkToken() clerkToken: string) {
    const workspaces = await this.workspacesService.getUserWorkspaces(clerkToken);

    return {
      message: 'Successfully retrieved workspaces',
      data: workspaces,
    };
  }

  /**
   * Get workspaces owned by the current user
   *
   * Example request:
   * GET /api/workspaces/owned
   * Headers: { Authorization: "Bearer <clerk-jwt-token>" }
   */
  @Get('owned')
  async getOwnedWorkspaces(@ClerkToken() clerkToken: string) {
    const workspaces = await this.workspacesService.getOwnedWorkspaces(clerkToken);

    return {
      message: 'Successfully retrieved owned workspaces',
      data: workspaces,
    };
  }

  /**
   * Get workspace by ID
   *
   * Example request:
   * GET /api/workspaces/:workspaceId
   * Headers: { Authorization: "Bearer <clerk-jwt-token>" }
   */
  @Get(':workspaceId')
  async getWorkspace(@ClerkToken() clerkToken: string, @Param('workspaceId') workspaceId: string) {
    // Check if user has access to this workspace
    const hasAccess = await this.workspacesService.hasWorkspaceAccess(clerkToken, workspaceId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this workspace');
    }

    const workspace = await this.workspacesService.getWorkspaceById(clerkToken, workspaceId);

    return {
      message: 'Successfully retrieved workspace',
      data: workspace,
    };
  }

  /**
   * Update workspace
   *
   * Example request:
   * PUT /api/workspaces/:workspaceId
   * Headers: { Authorization: "Bearer <clerk-jwt-token>" }
   * Body: { name: "Updated Workspace Name" }
   */
  @Put(':workspaceId')
  async updateWorkspace(
    @ClerkToken() clerkToken: string,
    @Param('workspaceId') workspaceId: string,
    @Body() updates: { name?: string }
  ) {
    // Check if user is admin or owner
    const isAdmin = await this.workspacesService.isWorkspaceAdmin(clerkToken, workspaceId);
    if (!isAdmin) {
      throw new ForbiddenException(
        'Only workspace admins and owners can update workspace settings'
      );
    }

    const workspace = await this.workspacesService.updateWorkspace(
      clerkToken,
      workspaceId,
      updates
    );

    return {
      message: 'Successfully updated workspace',
      data: workspace,
    };
  }

  /**
   * Delete workspace
   *
   * Example request:
   * DELETE /api/workspaces/:workspaceId
   * Headers: { Authorization: "Bearer <clerk-jwt-token>" }
   */
  @Delete(':workspaceId')
  async deleteWorkspace(
    @ClerkToken() clerkToken: string,
    @Param('workspaceId') workspaceId: string
  ) {
    // Only workspace owner can delete the workspace
    const isOwner = await this.workspacesService.isWorkspaceOwner(clerkToken, workspaceId);
    if (!isOwner) {
      throw new ForbiddenException('Only the workspace owner can delete the workspace');
    }

    await this.workspacesService.deleteWorkspace(clerkToken, workspaceId);

    return {
      message: 'Successfully deleted workspace',
      data: true,
    };
  }

  /**
   * Get workspace members
   *
   * Example request:
   * GET /api/workspaces/:workspaceId/members
   * Headers: { Authorization: "Bearer <clerk-jwt-token>" }
   */
  @Get(':workspaceId/members')
  async getWorkspaceMembers(
    @ClerkToken() clerkToken: string,
    @Param('workspaceId') workspaceId: string
  ) {
    // Check if user has access to this workspace
    const hasAccess = await this.workspacesService.hasWorkspaceAccess(clerkToken, workspaceId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this workspace');
    }

    const members = await this.workspacesService.getWorkspaceMembers(clerkToken, workspaceId);

    return {
      message: 'Successfully retrieved workspace members',
      data: members,
    };
  }

  /**
   * Add a member to workspace
   *
   * Example request:
   * POST /api/workspaces/:workspaceId/members
   * Headers: { Authorization: "Bearer <clerk-jwt-token>" }
   * Body: { userId: "user_123", role: "MEMBER" }
   */
  @Post(':workspaceId/members')
  async addWorkspaceMember(
    @ClerkToken() clerkToken: string,
    @Param('workspaceId') workspaceId: string,
    @Body() body: { userId: string; role?: 'OWNER' | 'ADMIN' | 'MEMBER' }
  ) {
    // Check if user is admin or owner
    const isAdmin = await this.workspacesService.isWorkspaceAdmin(clerkToken, workspaceId);
    if (!isAdmin) {
      throw new ForbiddenException('Only workspace admins and owners can add members');
    }

    // Only owners can add other owners
    if (body.role === 'OWNER') {
      const isOwner = await this.workspacesService.isWorkspaceOwner(clerkToken, workspaceId);
      if (!isOwner) {
        throw new ForbiddenException('Only the workspace owner can add other owners');
      }
    }

    const member = await this.workspacesService.addWorkspaceMember(
      clerkToken,
      workspaceId,
      body.userId,
      body.role || 'MEMBER'
    );

    return {
      message: 'Successfully added member to workspace',
      data: member,
    };
  }

  /**
   * Remove a member from workspace
   *
   * Example request:
   * DELETE /api/workspaces/:workspaceId/members/:memberId
   * Headers: { Authorization: "Bearer <clerk-jwt-token>" }
   */
  @Delete(':workspaceId/members/:memberId')
  async removeWorkspaceMember(
    @ClerkToken() clerkToken: string,
    @Param('workspaceId') workspaceId: string,
    @Param('memberId') memberId: string
  ) {
    // Check if user is admin or owner
    const isAdmin = await this.workspacesService.isWorkspaceAdmin(clerkToken, workspaceId);
    if (!isAdmin) {
      throw new ForbiddenException('Only workspace admins and owners can remove members');
    }

    // Check if trying to remove an owner
    const memberRole = await this.workspacesService.getSpecificUserRoleInWorkspace(
      clerkToken,
      workspaceId,
      memberId
    );
    if (memberRole === 'OWNER') {
      throw new ForbiddenException('Cannot remove workspace owner. Transfer ownership first.');
    }

    // Admins cannot remove other admins
    const isOwner = await this.workspacesService.isWorkspaceOwner(clerkToken, workspaceId);
    if (!isOwner && memberRole === 'ADMIN') {
      throw new ForbiddenException('Only the workspace owner can remove admins');
    }

    await this.workspacesService.removeWorkspaceMember(clerkToken, workspaceId, memberId);

    return {
      message: 'Successfully removed member from workspace',
      data: true,
    };
  }

  /**
   * Update a member's role in workspace
   *
   * Example request:
   * PUT /api/workspaces/:workspaceId/members/:memberId
   * Headers: { Authorization: "Bearer <clerk-jwt-token>" }
   * Body: { role: "ADMIN" }
   */
  @Put(':workspaceId/members/:memberId')
  async updateWorkspaceMemberRole(
    @ClerkToken() clerkToken: string,
    @Param('workspaceId') workspaceId: string,
    @Param('memberId') memberId: string,
    @Body('role') role: 'OWNER' | 'ADMIN' | 'MEMBER'
  ) {
    // Check if user is admin or owner
    const isAdmin = await this.workspacesService.isWorkspaceAdmin(clerkToken, workspaceId);
    if (!isAdmin) {
      throw new ForbiddenException('Only workspace admins and owners can update member roles');
    }

    // Only owners can promote to owner or modify owner roles
    const isOwner = await this.workspacesService.isWorkspaceOwner(clerkToken, workspaceId);
    const memberRole = await this.workspacesService.getSpecificUserRoleInWorkspace(
      clerkToken,
      workspaceId,
      memberId
    );

    if ((role === 'OWNER' || memberRole === 'OWNER') && !isOwner) {
      throw new ForbiddenException('Only the workspace owner can manage owner roles');
    }

    // Admins cannot modify other admin roles
    if (!isOwner && memberRole === 'ADMIN' && role !== 'ADMIN') {
      throw new ForbiddenException('Only the workspace owner can change admin roles');
    }

    const member = await this.workspacesService.updateWorkspaceMemberRole(
      clerkToken,
      workspaceId,
      memberId,
      role
    );

    return {
      message: 'Successfully updated member role',
      data: member,
    };
  }

  /**
   * Get current user's role in workspace
   *
   * Example request:
   * GET /api/workspaces/:workspaceId/role
   * Headers: { Authorization: "Bearer <clerk-jwt-token>" }
   */
  @Get(':workspaceId/role')
  async getUserRole(@ClerkToken() clerkToken: string, @Param('workspaceId') workspaceId: string) {
    const role = await this.workspacesService.getUserRoleInWorkspace(clerkToken, workspaceId);

    if (!role) {
      throw new NotFoundException('User is not a member of this workspace');
    }

    return {
      message: 'Successfully retrieved user role',
      data: { role },
    };
  }
}
