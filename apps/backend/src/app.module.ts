import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClerkAuthGuard } from './auth/clerk-auth.guard';
import { SupabaseModule } from './supabase/supabase.module';
import { UsersModule } from './users/users.module';
import { WorkspacesModule } from './workspaces/workspaces.module';

@Module({
  imports: [
    // Configure environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env', // Load from root .env
    }),
    // Import Supabase module globally
    SupabaseModule,
    // Import Users module for user management endpoints
    UsersModule,
    // Import Workspaces module for workspace management endpoints
    WorkspacesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Apply Clerk authentication guard globally to all routes
    {
      provide: APP_GUARD,
      useClass: ClerkAuthGuard,
    },
  ],
})
export class AppModule {}
