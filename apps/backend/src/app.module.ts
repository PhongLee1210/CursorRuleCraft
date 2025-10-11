import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { ClerkAuthGuard } from '@/auth/clerk-auth.guard';
import { RepositoriesModule } from '@/repositories/repositories.module';
import { SupabaseModule } from '@/supabase/supabase.module';
import { WorkspacesModule } from '@/workspaces/workspaces.module';
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
    SupabaseModule,
    WorkspacesModule,
    RepositoriesModule,
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
