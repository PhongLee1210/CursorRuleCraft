import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UsersService } from './users.service';

/**
 * Users Controller
 *
 * This controller provides endpoints for user management.
 * All endpoints are protected by the ClerkAuthGuard (applied globally).
 *
 * The authenticated user's data is available via the @CurrentUser() decorator.
 */
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Get the current authenticated user's profile
   *
   * Example request:
   * GET /api/users/me
   * Headers: { Authorization: "Bearer <clerk-jwt-token>" }
   */
  @Get('me')
  async getCurrentUser(@CurrentUser('sub') userId: string) {
    const user = await this.usersService.getUserProfile(userId);

    return {
      message: 'Successfully retrieved current user',
      data: user,
    };
  }

  /**
   * Update the current user's profile
   *
   * Example request:
   * PUT /api/users/me
   * Headers: { Authorization: "Bearer <clerk-jwt-token>" }
   * Body: { name: "John Doe", username: "johndoe" }
   */
  @Put('me')
  async updateCurrentUser(
    @CurrentUser('sub') userId: string,
    @Body() updates: Record<string, any>
  ) {
    const updatedUser = await this.usersService.updateUserProfile(userId, updates);

    return {
      message: 'Successfully updated user profile',
      data: updatedUser,
    };
  }

  /**
   * Delete the current user's account
   *
   * Example request:
   * DELETE /api/users/me
   * Headers: { Authorization: "Bearer <clerk-jwt-token>" }
   */
  @Delete('me')
  async deleteCurrentUser(@CurrentUser('sub') userId: string) {
    await this.usersService.deleteUser(userId);

    return {
      message: 'Successfully deleted user account',
      data: true,
    };
  }

  /**
   * Create a new user (typically called after Clerk sign up)
   *
   * Example request:
   * POST /api/users
   * Headers: { Authorization: "Bearer <clerk-jwt-token>" }
   * Body: { id: "user_123", name: "John Doe", email: "john@example.com", username: "johndoe" }
   */
  @Post()
  async createUser(@Body() userData: any) {
    const user = await this.usersService.createUser(userData);

    return {
      message: 'Successfully created user',
      data: user,
    };
  }

  /**
   * Sync user from Clerk to Supabase
   *
   * Example request:
   * POST /api/users/sync
   * Headers: { Authorization: "Bearer <clerk-jwt-token>" }
   * Body: { id: "user_123", name: "John Doe", email: "john@example.com", ... }
   */
  @Post('sync')
  async syncUser(@CurrentUser() clerkUser: any, @Body() userData?: any) {
    const dataToSync = userData || {
      id: clerkUser.sub,
      email: clerkUser.email,
      name: clerkUser.name,
    };

    const user = await this.usersService.syncUserFromClerk(dataToSync.id, dataToSync);

    return {
      message: 'Successfully synced user',
      data: user,
    };
  }

  /**
   * Get all users with pagination and filters
   *
   * Example request:
   * GET /api/users?page=1&limit=10&email=john@example.com
   * Headers: { Authorization: "Bearer <clerk-jwt-token>" }
   */
  @Get()
  async getAllUsers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('email') email?: string,
    @Query('username') username?: string,
    @Query('provider') provider?: string
  ) {
    const filters = { email, username, provider };
    const pagination = { page: page || 1, limit: limit || 10 };

    const result = await this.usersService.getUsers(filters, pagination);

    return {
      message: 'Successfully retrieved users',
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      hasMore: result.hasMore,
    };
  }

  /**
   * Get user by ID
   *
   * Example request:
   * GET /api/users/id/user_123
   * Headers: { Authorization: "Bearer <clerk-jwt-token>" }
   */
  @Get('id/:userId')
  async getUserById(@Param('userId') userId: string) {
    const user = await this.usersService.getUserProfile(userId);

    return {
      message: 'Successfully retrieved user',
      data: user,
    };
  }

  /**
   * Get user by email
   *
   * Example request:
   * GET /api/users/email/john@example.com
   * Headers: { Authorization: "Bearer <clerk-jwt-token>" }
   */
  @Get('email/:email')
  async getUserByEmail(@Param('email') email: string) {
    const user = await this.usersService.getUserByEmail(email);

    return {
      message: 'Successfully retrieved user',
      data: user,
    };
  }

  /**
   * Get user by username
   *
   * Example request:
   * GET /api/users/username/johndoe
   * Headers: { Authorization: "Bearer <clerk-jwt-token>" }
   */
  @Get('username/:username')
  async getUserByUsername(@Param('username') username: string) {
    const user = await this.usersService.getUserByUsername(username);

    return {
      message: 'Successfully retrieved user',
      data: user,
    };
  }

  /**
   * Check if username is available
   *
   * Example request:
   * GET /api/users/check-username/johndoe?excludeUserId=user_123
   * Headers: { Authorization: "Bearer <clerk-jwt-token>" }
   */
  @Get('check-username/:username')
  async checkUsername(
    @Param('username') username: string,
    @Query('excludeUserId') excludeUserId?: string
  ) {
    const isAvailable = await this.usersService.isUsernameAvailable(username, excludeUserId);

    return {
      message: 'Successfully checked username availability',
      data: isAvailable,
    };
  }
}
