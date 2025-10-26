import { AppService } from '@backend/app.service';
import { Public } from '@backend/auth/decorators/public.decorator';
import { Controller, Get } from '@nestjs/common';

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
}
