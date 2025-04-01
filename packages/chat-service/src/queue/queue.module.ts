import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TranslationProducerService } from './translation-producer.service';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    BullModule.registerQueue({
      name: 'translation',
    }),
  ],
  providers: [TranslationProducerService],
  exports: [BullModule, TranslationProducerService],
})
export class QueueModule {}
