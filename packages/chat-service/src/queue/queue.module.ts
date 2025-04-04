import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TranslationProducerService } from './translation-producer.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        url: `redis://${configService.get('redis.host') || 'localhost'}:${configService.get('redis.port') || '6379'}`,
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueueAsync({
      name: 'translation',
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        name: configService.get('queue.translation'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [TranslationProducerService],
  exports: [BullModule, TranslationProducerService],
})
export class QueueModule {}
