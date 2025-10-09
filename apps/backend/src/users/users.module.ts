import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

/**
 * Users Module
 *
 * This module demonstrates how to create protected endpoints that:
 * 1. Require authentication via Clerk JWT
 * 2. Access the authenticated user's data
 * 3. Interact with Supabase using the Service Role Key
 */
@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
