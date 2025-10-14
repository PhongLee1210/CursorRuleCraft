// Register path aliases for runtime (production)
import 'module-alias/register';

import { AppModule } from '@/app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import 'reflect-metadata';

// Declare webpack HMR types
declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend
  // Support multiple origins via comma-separated ALLOWED_ORIGINS env var
  // or fallback to FRONTEND_URL for single origin
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
    : process.env.FRONTEND_URL
      ? [process.env.FRONTEND_URL]
      : [];

  app.enableCors({
    origin:
      allowedOrigins.length > 0
        ? allowedOrigins
        : process.env.NODE_ENV === 'development'
          ? true // Allow all origins in development if not specified
          : false, // Block all origins in production if not specified
    credentials: true,
  });

  // Enable validation pipes globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: false, // Don't throw errors for extra properties
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Enable type conversion
      },
    })
  );

  // Global prefix for all routes
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 4000;
  const host = process.env.HOST || '0.0.0.0';
  await app.listen(port, host);

  console.log('🚀 Backend server is running!');
  console.log(`📡 Server listening on: ${host}:${port}`);
  console.log(`🔗 API endpoint: ${host}:${port}/api`);
  if (allowedOrigins.length > 0) {
    console.log(`🔐 Allowed origins: ${allowedOrigins.join(', ')}`);
  }

  // Enable Hot Module Replacement (HMR) in development
  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}

bootstrap();
