import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppLogger, GlobalExceptionFilter, setupSwaggerDoc } from '@chatti/shared-types';

async function bootstrap() {
  // Create the app
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // Buffer logs until logger is available
  });
  app.enableCors();

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
      exceptionFactory: (errors) => {
        logger.error(`Validation error: ${JSON.stringify(errors)}`);
        return errors;
      },
    }),
  );

  // Set up Swagger documentation
  const configService = app.get(ConfigService);
  setupSwaggerDoc(app, {
    title: 'Auth Service API',
    description: 'API documentation for the Chatti Auth Service',
    version: configService.get<string>('npm_package_version') || '1.0.0',
    tag: 'auth',
    path: 'api/docs',
  });

  // Start the server
  const port = configService.get<number>('port') || 4000;
  
  await app.listen(port);
  logger.log(`Auth service is running on port ${port}`);
}
bootstrap();
