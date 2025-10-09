import { SetMetadata } from '@nestjs/common';

/**
 * Public Decorator
 *
 * Use this decorator to mark routes that should be accessible without authentication.
 *
 * Example:
 * ```typescript
 * @Public()
 * @Get('health')
 * healthCheck() {
 *   return { status: 'ok' };
 * }
 * ```
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
