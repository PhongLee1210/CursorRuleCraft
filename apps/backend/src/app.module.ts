import { AIModule } from '@backend/ai/ai.module';
import { AppController } from '@backend/app.controller';
import { AppService } from '@backend/app.service';
import { ClerkAuthGuard } from '@backend/auth/clerk-auth.guard';
import { HealthModule } from '@backend/health/health.module';
import { RepositoriesModule } from '@backend/repositories/repositories.module';
import { SupabaseModule } from '@backend/supabase/supabase.module';
import { WebhooksModule } from '@backend/webhooks/webhooks.module';
import { WorkspacesModule } from '@backend/workspaces/workspaces.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, Reflector } from '@nestjs/core';

@Module({
  imports: [
    // Configure environment variables FIRST - required by other modules
    // In Nx monorepos, the working directory is the workspace root
    // So we load .env from the root (where nx commands run from)
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env', // Nx runs from workspace root, so this points to root .env
      ignoreEnvFile: false,
    }),
    HealthModule,
    SupabaseModule,
    WebhooksModule,
    WorkspacesModule,
    RepositoriesModule,
    AIModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Apply Clerk authentication guard globally to all routes using factory
    {
      provide: APP_GUARD,
      useFactory: (reflector: Reflector, configService: ConfigService) => {
        return new ClerkAuthGuard(reflector, configService);
      },
      inject: [Reflector, ConfigService],
    },
  ],
})
export class AppModule {}
