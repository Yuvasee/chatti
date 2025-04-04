import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { BullModule } from '@nestjs/bull';
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
  providers: [QueueService],
  exports: [BullModule, QueueService],
})
export class QueueModule {}
