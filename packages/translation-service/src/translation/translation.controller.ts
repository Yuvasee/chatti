import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { TranslationService } from './translation.service';
import { QueueService } from '../queue/queue.service';
import { 
  TranslationRequestDto, 
  TranslationResponseDto,
  AppLogger,
  ErrorCode,
  AppError,
  handleError,
  getErrorMessage
} from '@chatti/shared-types';

@Controller('translation')
export class TranslationController {
  constructor(
    private readonly translationService: TranslationService,
    private readonly queueService: QueueService,
    private readonly logger: AppLogger
  ) {}

  @Post('queue')
  async queueTranslation(@Body() job: TranslationRequestDto) {
    try {
      this.logger.log(`Received request to queue translation for message: ${job.messageId}`);
      
      await this.queueService.addTranslationJob(job);
      
      this.logger.log(`Successfully queued translation for message: ${job.messageId}`);
      return { success: true, message: 'Translation job queued successfully' };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(
        `Failed to queue translation job: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined
      );
      
      throw error instanceof AppError 
        ? error 
        : new AppError(`Failed to queue translation: ${errorMessage}`, ErrorCode.TRANSLATION_ERROR);
    }
  }

  @Get('queue/status')
  async getQueueStatus() {
    try {
      this.logger.log('Received request for queue status');
      
      const status = await this.queueService.getQueueCount();
      
      this.logger.log(`Queue status: ${JSON.stringify(status)}`);
      return status;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(
        `Failed to get queue status: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined
      );
      
      throw error instanceof AppError 
        ? error 
        : new AppError(`Failed to get queue status: ${errorMessage}`, ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('test')
  async testTranslation(
    @Query('text') text: string,
    @Query('source') source: string = 'en',
    @Query('target') target: string,
  ) {
    try {
      this.logger.log(`Received test translation request: ${source} to ${target}`);
      
      if (!text || !target) {
        this.logger.warn('Missing required parameters for test translation');
        throw new AppError(
          'Missing required parameters: text and target',
          ErrorCode.VALIDATION_ERROR
        );
      }

      const translation = await this.translationService.translateText(text, source, target);

      this.logger.log(`Successfully completed test translation from ${source} to ${target}`);
      
      return {
        originalText: text,
        translatedText: translation,
        sourceLanguage: source,
        targetLanguage: target,
      };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(
        `Test translation failed: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined
      );
      
      if (error instanceof AppError) {
        return { 
          error: errorMessage,
          code: error.code 
        };
      }
      
      return { 
        error: errorMessage,
        code: ErrorCode.TRANSLATION_ERROR 
      };
    }
  }
}
