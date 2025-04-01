import { Module } from '@nestjs/common';
import { TranslationModule } from './translation/translation.module';
import { QueueModule } from './queue/queue.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TranslationModule,
    QueueModule,
    DatabaseModule,
  ],
})
export class AppModule {}
