import { BadRequestException, Controller, Post, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { WebhooksService } from './webhooks.service';

/**
 * Webhooks Controller
 *
 * Handles incoming webhooks from Clerk for user events.
 * Automatically creates workspaces when users sign up.
 *
 * Note: This endpoint is public but verifies webhook signatures for security.
 */
@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Handle Clerk webhooks
   *
   * This endpoint receives webhooks from Clerk when user events occur.
   * Currently handles:
   * - user.created: Automatically create a workspace for new users
   * - user.updated: Handle user profile updates (if needed)
   * - user.deleted: Automatically clean up workspaces owned by deleted users
   *
   * Example request:
   * POST /api/webhooks
   * Headers: { svix-id: "...", svix-timestamp: "...", svix-signature: "..." }
   * Body: { type: "user.created", data: { id: "user_123", ... } }
   *
   * Note: Webhook verification is handled automatically using the full Request object
   */
  @Public()
  @Post()
  async handleWebhook(@Req() request: Request) {
    const webhookSecret = this.configService.get<string>('CLERK_WEBHOOK_SIGNING_SECRET');
    if (!webhookSecret) {
      throw new BadRequestException('CLERK_WEBHOOK_SIGNING_SECRET is not configured');
    }

    try {
      // Verify webhook signature and parse payload using the full Request object
      const event = await this.webhooksService.verifyWebhook(request, webhookSecret);

      console.log(`[Webhooks] Received ${event.type} event for user ${event.data.id}`);

      // Handle different event types
      switch (event.type) {
        case 'user.created':
          await this.webhooksService.handleUserCreated(event);
          break;
        case 'user.updated':
          await this.webhooksService.handleUserUpdated(event);
          break;
        case 'user.deleted':
          await this.webhooksService.handleUserDeleted(event);
          break;
        default:
          console.log(`[Webhooks] Unhandled event type: ${event.type}`);
      }

      return { success: true, message: 'Webhook processed successfully' };
    } catch (error) {
      console.error('[Webhooks] Webhook verification/processing failed:', error);
      throw new BadRequestException('Webhook verification failed');
    }
  }
}
