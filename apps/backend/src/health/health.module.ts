import { HealthController } from '@backend/health/health.controller';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

@Module({
  imports: [
    TerminusModule,
    HttpModule, // Required for HttpHealthIndicator
  ],
  controllers: [HealthController],
})
export class HealthModule {}
