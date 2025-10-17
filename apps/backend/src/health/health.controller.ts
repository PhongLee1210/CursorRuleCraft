import { Public } from '@/auth/decorators/public.decorator';
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, HttpHealthIndicator } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator
  ) {}

  @Get()
  @Public() // Make health check endpoint public (bypass auth)
  @HealthCheck()
  check() {
    return this.health.check([
      // Check if the service itself is responding
      () => this.http.pingCheck('backend', 'http://localhost:4000/api'),
    ]);
  }

  @Get('ready')
  @Public()
  @HealthCheck()
  readiness() {
    // Readiness check - more comprehensive, includes dependencies
    return this.health.check([
      () => this.http.pingCheck('backend', 'http://localhost:4000/api'),
      // Add more checks here (database, external services, etc.)
    ]);
  }

  @Get('live')
  @Public()
  @HealthCheck()
  liveness() {
    // Liveness check - simple check that service is alive
    return this.health.check([() => this.http.pingCheck('backend', 'http://localhost:4000/api')]);
  }
}
