import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Current User Decorator
 *
 * Use this decorator to extract the authenticated user's data from the request.
 * This data is attached by the ClerkAuthGuard after successful authentication.
 *
 * Example:
 * ```typescript
 * @Get('profile')
 * getProfile(@CurrentUser() user: any) {
 *   return { user };
 * }
 * ```
 *
 * You can also extract specific fields:
 * ```typescript
 * @Get('user-id')
 * getUserId(@CurrentUser('sub') userId: string) {
 *   return { userId };
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.auth;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  }
);
