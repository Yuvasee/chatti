import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { AppLogger, GlobalExceptionFilter, setupSwaggerDoc } from '@chatti/shared-types';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  
  // Get the logger instance
  const logger = app.get(AppLogger);
  app.useLogger(logger);
  
  // Add global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter(logger));
  
  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  
  // Set up Swagger documentation
  const configService = app.get(ConfigService);
  setupSwaggerDoc(app, {
    title: 'Chat Service API',
    description: 'API documentation for the Chatti Chat Service',
    version: configService.get<string>('npm_package_version') || '1.0.0',
    tag: 'chat',
    path: 'api/docs',
  });
  
  const port = configService.get<number>('port') || 4001;
  
  await app.listen(port);
  logger.log(`Chat service is running on port ${port}`);
}
bootstrap();
