import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { TranslationService } from './translation.service';
import { QueueService } from '../queue/queue.service';
import { 
  TranslationRequestDto, 
  TranslationResponseDto,
  AppLogger,
  ErrorCode,
  AppError,
  
  getErrorMessage,
  ApiResponseDto,
  ApiErrorResponseDto
} from '@chatti/shared-types';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';

@ApiTags('Translation')
@Controller('translation')
export class TranslationController {
  constructor(
    private readonly translationService: TranslationService,
    private readonly queueService: QueueService,
    private readonly logger: AppLogger
  ) {}

  @Post('queue')
  @ApiOperation({ summary: 'Queue a new translation job' })
  @ApiResponse({ 
    status: 201, 
    description: 'Translation job queued successfully',
    type: () => ApiResponseDto<{ success: boolean }>
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid translation data', 
    type: ApiErrorResponseDto
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Server error',
    type: ApiErrorResponseDto
  })
  async queueTranslation(@Body() job: TranslationRequestDto): Promise<ApiResponseDto<{ success: boolean }>> {
    try {
      this.logger.log(`Received request to queue translation for message: ${job.messageId}`);
      
      await this.queueService.addTranslationJob(job);
      
      this.logger.log(`Successfully queued translation for message: ${job.messageId}`);
      return new ApiResponseDto<{ success: boolean }>({ success: true }, 'Translation job queued successfully');
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
  @ApiOperation({ summary: 'Get translation queue status' })
  @ApiResponse({ 
    status: 200, 
    description: 'Queue status retrieved successfully', 
    type: () => ApiResponseDto<{
      waiting: number;
      active: number;
      completed: number;
      failed: number;
    }>
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Server error',
    type: ApiErrorResponseDto
  })
  async getQueueStatus(): Promise<ApiResponseDto<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }>> {
    try {
      this.logger.log('Received request for queue status');
      
      const status = await this.queueService.getQueueCount();
      
      this.logger.log(`Queue status: ${JSON.stringify(status)}`);
      return new ApiResponseDto(status, 'Queue status retrieved successfully');
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
