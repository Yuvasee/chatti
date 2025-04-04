import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { TranslationService } from './translation.service';
import { QueueService } from '../queue/queue.service';
import { TranslationJobDto, TranslationResultDto } from '@chatti/shared-types';

@Controller('translation')
export class TranslationController {
  constructor(
    private readonly translationService: TranslationService,
    private readonly queueService: QueueService,
  ) {}

  @Post('queue')
  async queueTranslation(@Body() job: TranslationJobDto) {
    return this.queueService.addTranslationJob(job);
  }

  @Get('queue/status')
  async getQueueStatus() {
    return this.queueService.getQueueCount();
  }

  @Get('test')
  async testTranslation(
    @Query('text') text: string,
    @Query('source') source: string = 'en',
    @Query('target') target: string,
  ) {
    if (!text || !target) {
      return { error: 'Missing required parameters: text and target' };
    }

    try {
      const translation = await this.translationService.translateText(text, source, target);

      return {
        originalText: text,
        translatedText: translation,
        sourceLanguage: source,
        targetLanguage: target,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return { error: errorMessage };
    }
  }
}
