import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TranslationModule } from './translation/translation.module';
import { QueueModule } from './queue/queue.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { LoggingModule, RequestLoggerMiddleware } from '@chatti/shared-types';
import configuration from './config/configuration';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    LoggingModule.forRoot({
      serviceName: 'translation-service',
    }),
    TranslationModule,
    QueueModule,
    DatabaseModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
