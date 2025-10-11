import { AppModule } from '@/app.module';
import { NestFactory } from '@nestjs/core';
import 'reflect-metadata';

// Declare webpack HMR types
declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:5173', // Vite default port
    ].filter(Boolean),
    credentials: true,
  });

  // Global prefix for all routes
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 4000;
  await app.listen(port);

  console.log('🚀 Backend server is running!');
  console.log(`📡 Server listening on: http://localhost:${port}`);
  console.log(`🔗 API endpoint: http://localhost:${port}/api`);

  // Enable Hot Module Replacement (HMR) in development
  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}

bootstrap();
