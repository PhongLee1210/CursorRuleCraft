import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Clerk Token Decorator
 *
 * Extracts the raw Clerk JWT token from the request object.
 * This token is attached by the ClerkAuthGuard after verification.
 *
 * Usage:
 * ```typescript
 * @Get()
 * async myMethod(@ClerkToken() token: string) {
 *   // Use token to create Supabase client
 *   const supabaseClient = this.supabaseService.getClientWithClerkToken(token);
 * }
 * ```
 */
export const ClerkToken = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.clerkToken;
});
