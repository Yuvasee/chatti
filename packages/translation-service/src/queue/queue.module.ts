import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { BullModule } from '@nestjs/bull';
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
  providers: [QueueService],
  exports: [BullModule, QueueService],
})
export class QueueModule {}
