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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
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
  async createWorkspace(@CurrentUser('sub') userId: string, @Body('name') name: string) {
    if (!name || name.trim().length === 0) {
      throw new Error('Workspace name is required');
    }

    const workspace = await this.workspacesService.createWorkspace(userId, name.trim());

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
  async getUserWorkspaces(@CurrentUser('sub') userId: string) {
    const workspaces = await this.workspacesService.getUserWorkspaces(userId);

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
  async getOwnedWorkspaces(@CurrentUser('sub') userId: string) {
    const workspaces = await this.workspacesService.getOwnedWorkspaces(userId);

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
  async getWorkspace(
    @CurrentUser('sub') userId: string,
    @Param('workspaceId') workspaceId: string
  ) {
    // Check if user has access to this workspace
    const hasAccess = await this.workspacesService.hasWorkspaceAccess(workspaceId, userId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this workspace');
    }

    const workspace = await this.workspacesService.getWorkspaceById(workspaceId);

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
    @CurrentUser('sub') userId: string,
    @Param('workspaceId') workspaceId: string,
    @Body() updates: { name?: string }
  ) {
    // Check if user is admin or owner
    const isAdmin = await this.workspacesService.isWorkspaceAdmin(workspaceId, userId);
    if (!isAdmin) {
      throw new ForbiddenException(
        'Only workspace admins and owners can update workspace settings'
      );
    }

    const workspace = await this.workspacesService.updateWorkspace(workspaceId, updates);

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
    @CurrentUser('sub') userId: string,
    @Param('workspaceId') workspaceId: string
  ) {
    // Only workspace owner can delete the workspace
    const isOwner = await this.workspacesService.isWorkspaceOwner(workspaceId, userId);
    if (!isOwner) {
      throw new ForbiddenException('Only the workspace owner can delete the workspace');
    }

    await this.workspacesService.deleteWorkspace(workspaceId);

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
    @CurrentUser('sub') userId: string,
    @Param('workspaceId') workspaceId: string
  ) {
    // Check if user has access to this workspace
    const hasAccess = await this.workspacesService.hasWorkspaceAccess(workspaceId, userId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this workspace');
    }

    const members = await this.workspacesService.getWorkspaceMembers(workspaceId);

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
    @CurrentUser('sub') userId: string,
    @Param('workspaceId') workspaceId: string,
    @Body() body: { userId: string; role?: 'OWNER' | 'ADMIN' | 'MEMBER' }
  ) {
    // Check if user is admin or owner
    const isAdmin = await this.workspacesService.isWorkspaceAdmin(workspaceId, userId);
    if (!isAdmin) {
      throw new ForbiddenException('Only workspace admins and owners can add members');
    }

    // Only owners can add other owners
    if (body.role === 'OWNER') {
      const isOwner = await this.workspacesService.isWorkspaceOwner(workspaceId, userId);
      if (!isOwner) {
        throw new ForbiddenException('Only the workspace owner can add other owners');
      }
    }

    const member = await this.workspacesService.addWorkspaceMember(
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
    @CurrentUser('sub') userId: string,
    @Param('workspaceId') workspaceId: string,
    @Param('memberId') memberId: string
  ) {
    // Check if user is admin or owner
    const isAdmin = await this.workspacesService.isWorkspaceAdmin(workspaceId, userId);
    if (!isAdmin) {
      throw new ForbiddenException('Only workspace admins and owners can remove members');
    }

    // Check if trying to remove an owner
    const memberRole = await this.workspacesService.getUserRoleInWorkspace(workspaceId, memberId);
    if (memberRole === 'OWNER') {
      throw new ForbiddenException('Cannot remove workspace owner. Transfer ownership first.');
    }

    // Admins cannot remove other admins
    const isOwner = await this.workspacesService.isWorkspaceOwner(workspaceId, userId);
    if (!isOwner && memberRole === 'ADMIN') {
      throw new ForbiddenException('Only the workspace owner can remove admins');
    }

    await this.workspacesService.removeWorkspaceMember(workspaceId, memberId);

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
    @CurrentUser('sub') userId: string,
    @Param('workspaceId') workspaceId: string,
    @Param('memberId') memberId: string,
    @Body('role') role: 'OWNER' | 'ADMIN' | 'MEMBER'
  ) {
    // Check if user is admin or owner
    const isAdmin = await this.workspacesService.isWorkspaceAdmin(workspaceId, userId);
    if (!isAdmin) {
      throw new ForbiddenException('Only workspace admins and owners can update member roles');
    }

    // Only owners can promote to owner or modify owner roles
    const isOwner = await this.workspacesService.isWorkspaceOwner(workspaceId, userId);
    const memberRole = await this.workspacesService.getUserRoleInWorkspace(workspaceId, memberId);

    if ((role === 'OWNER' || memberRole === 'OWNER') && !isOwner) {
      throw new ForbiddenException('Only the workspace owner can manage owner roles');
    }

    // Admins cannot modify other admin roles
    if (!isOwner && memberRole === 'ADMIN' && role !== 'ADMIN') {
      throw new ForbiddenException('Only the workspace owner can change admin roles');
    }

    const member = await this.workspacesService.updateWorkspaceMemberRole(
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
  async getUserRole(@CurrentUser('sub') userId: string, @Param('workspaceId') workspaceId: string) {
    const role = await this.workspacesService.getUserRoleInWorkspace(workspaceId, userId);

    if (!role) {
      throw new NotFoundException('User is not a member of this workspace');
    }

    return {
      message: 'Successfully retrieved user role',
      data: { role },
    };
  }
}
