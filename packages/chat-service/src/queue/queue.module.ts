import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TranslationProducerService } from './translation-producer.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueNames, getRedisConfig, getQueueConfig } from '@chatti/shared-types';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => getRedisConfig(
        configService.get('redis.host') || 'localhost',
        configService.get('redis.port') || 6379
      ),
      inject: [ConfigService],
    }),
    BullModule.registerQueueAsync({
      name: QueueNames.TRANSLATION,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => getQueueConfig(
        configService.get('queue.translation') || QueueNames.TRANSLATION
      ),
      inject: [ConfigService],
    }),
  ],
  providers: [TranslationProducerService],
  exports: [BullModule, TranslationProducerService],
})
export class QueueModule {}
