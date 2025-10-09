import { createClerkClient } from '@clerk/backend';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';

/**
 * Clerk Authentication Guard
 *
 * This guard validates JWT tokens from Clerk on every incoming request.
 * It:
 * 1. Checks if the route is marked as public (using @Public decorator)
 * 2. Extracts the JWT token from the Authorization header
 * 3. Verifies the token with Clerk
 * 4. Attaches the authenticated user data to the request object
 *
 * This guard is registered globally in AppModule, so it applies to all routes
 * unless explicitly marked with @Public().
 */
@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private clerkClient;

  constructor(
    private reflector: Reflector,
    private configService: ConfigService
  ) {
    const secretKey = this.configService.get<string>('CLERK_SECRET_KEY');

    if (!secretKey) {
      throw new Error('CLERK_SECRET_KEY is not defined in environment variables');
    }

    // Initialize Clerk client with secret key
    this.clerkClient = createClerkClient({ secretKey });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException(
        'Authorization token is missing. Please provide a valid Bearer token.'
      );
    }

    try {
      // Verify the token with Clerk
      const verifiedToken = await this.clerkClient.verifyToken(token, {
        secretKey: this.configService.get<string>('CLERK_SECRET_KEY'),
      });

      // Attach the verified token payload to the request
      // This makes the user data available in controllers via @Req()
      (request as any).auth = verifiedToken;
      (request as any).userId = verifiedToken.sub;

      return true;
    } catch (error) {
      console.error('Token verification failed:', error);
      throw new UnauthorizedException('Invalid or expired authentication token');
    }
  }

  /**
   * Extract JWT token from Authorization header
   * Expected format: "Bearer <token>"
   */
  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer') {
      throw new UnauthorizedException(
        'Invalid authorization header format. Expected: "Bearer <token>"'
      );
    }

    return token;
  }
}
