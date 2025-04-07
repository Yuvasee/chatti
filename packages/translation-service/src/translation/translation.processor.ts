import { Process, Processor } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import { TranslationService } from './translation.service';
import { 
  TranslationRequestDto, 
  QueueNames, 
  ProcessorNames, 
  AppLogger,
  ErrorCode,
  AppError,
  getErrorMessage
} from '@chatti/shared-types';

/**
 * BullMQ processor for translation jobs
 * Consumes jobs from the translation queue and processes them
 * Expects jobs in the TranslationRequestDto format
 */
@Processor(QueueNames.TRANSLATION)
export class TranslationProcessor {
  constructor(
    private readonly translationService: TranslationService,
    private readonly configService: ConfigService,
    private readonly logger: AppLogger
  ) {}

  /**
   * Process translation jobs from the queue
   */
  @Process(ProcessorNames.TRANSLATE)
  async processTranslation(job: Job<TranslationRequestDto>) {
    try {
      const { messageId, targetLanguage, sourceLanguage } = job.data;
      this.logger.log(`Processing translation job ${job.id} for messageId: ${messageId} from ${sourceLanguage} to ${targetLanguage}`);

      // Process the translation job
      await this.translationService.processTranslation(job.data);

      this.logger.log(
        `Successfully processed translation job ${job.id} for messageId: ${messageId}`,
      );
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(
        `Failed to process translation job ${job.id}: ${errorMessage}`, 
        error instanceof Error ? error.stack : undefined
      );
      
      // Convert any error to an AppError for consistent handling
      if (!(error instanceof AppError)) {
        throw new AppError(
          `Translation failed: ${errorMessage}`, 
          ErrorCode.TRANSLATION_ERROR
        );
      }
      
      throw error; // Rethrow to trigger job retry
    }
  }
}
