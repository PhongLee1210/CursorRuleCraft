import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Health check endpoint - publicly accessible
   * This endpoint is marked as public so it bypasses authentication
   */
  @Public()
  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'CursorRuleCraft Backend',
    };
  }

  /**
   * Protected endpoint example
   * This requires authentication via Clerk JWT
   */
  @Get('hello')
  getHello() {
    return this.appService.getHello();
  }
}
