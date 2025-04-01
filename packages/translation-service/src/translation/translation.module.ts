import { Module } from '@nestjs/common';
import { TranslationService } from './translation.service';
import { TranslationController } from './translation.controller';
import { QueueModule } from '../queue/queue.module';
import { DatabaseModule } from '../database/database.module';
import { ConfigModule } from '@nestjs/config';
import { TranslationProcessor } from './translation.processor';

@Module({
  imports: [ConfigModule, QueueModule, DatabaseModule],
  controllers: [TranslationController],
  providers: [TranslationService, TranslationProcessor],
  exports: [TranslationService],
})
export class TranslationModule {}
