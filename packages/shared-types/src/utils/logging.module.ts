import { DynamicModule, Global, Module } from '@nestjs/common';
import { AppLogger, AppLoggerOptions } from './logging';
import { RequestLoggerMiddleware } from './request-logger.middleware';

@Global()
@Module({})
export class LoggingModule {
  static forRoot(options: AppLoggerOptions): DynamicModule {
    return {
      module: LoggingModule,
      providers: [
        {
          provide: AppLogger,
          useValue: new AppLogger(options),
        },
        RequestLoggerMiddleware,
      ],
      exports: [AppLogger, RequestLoggerMiddleware],
    };
  }
} 