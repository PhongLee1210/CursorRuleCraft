import { SupabaseModule } from '@/supabase/supabase.module';
import { WebhooksController } from '@/webhooks/webhooks.controller';
import { WebhooksService } from '@/webhooks/webhooks.service';
import { Module } from '@nestjs/common';

/**
 * Webhooks Module
 *
 * This module handles incoming webhooks from external services like Clerk.
 * It provides automatic workspace creation when users sign up.
 *
 * Features:
 * - Clerk webhook verification and signature validation
 * - Automatic workspace creation for new users
 * - Automatic workspace cleanup when users are deleted
 * - Event-driven architecture for user lifecycle events
 * - Service role operations to bypass RLS policies
 */
@Module({
  imports: [SupabaseModule],
  controllers: [WebhooksController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
