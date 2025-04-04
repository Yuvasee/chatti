import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import { TranslationService } from './translation.service';
import { TranslationJob } from '../queue/queue.service';

@Processor('translation')
export class TranslationProcessor {
  private readonly logger = new Logger(TranslationProcessor.name);

  constructor(
    private readonly translationService: TranslationService,
    private readonly configService: ConfigService,
  ) {}

  @Process('translate')
  async processTranslation(job: Job<TranslationJob>) {
    this.logger.log(`Processing translation job ${job.id} for messageId: ${job.data.messageId}`);

    try {
      await this.translationService.processTranslation(
        job.data.messageId,
        job.data.originalText,
        job.data.sourceLanguage,
        job.data.targetLanguage,
      );

      this.logger.log(
        `Successfully processed translation job ${job.id} for messageId: ${job.data.messageId}`,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to process translation job ${job.id}: ${errorMessage}`, errorStack);
      throw error; // Rethrow to trigger job retry
    }
  }
}
