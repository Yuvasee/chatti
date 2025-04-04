import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppLogger, GlobalExceptionFilter } from '@chatti/shared-types';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Get the logger instance
  const logger = app.get(AppLogger);
  app.useLogger(logger);
  
  // Add global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter(logger));

  app.enableCors();

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 4002;

  await app.listen(port);
  logger.log(`Translation service is running on port ${port}`);
}
bootstrap();
