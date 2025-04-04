import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppLogger, GlobalExceptionFilter } from '@chatti/shared-types';

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

  // Start the server
  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 4000;
  
  await app.listen(port);
  logger.log(`Auth service is running on port ${port}`);
}
bootstrap();
