import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { 
  TranslationRequestDto, 
  QueueNames, 
  ProcessorNames,
  DEFAULT_JOB_OPTIONS,
  AppLogger 
} from '@chatti/shared-types';

/**
 * Service for adding translation jobs to the BullMQ queue
 * This is the single point of entry for all translation requests in the system
 */
@Injectable()
export class TranslationProducerService {
  private readonly queueName: string;

  constructor(
    @InjectQueue(QueueNames.TRANSLATION) 
    private translationQueue: Queue,
    private configService: ConfigService,
    private readonly logger: AppLogger
  ) {
    this.queueName = this.configService.get<string>('queue.translation') || QueueNames.TRANSLATION;
  }

  /**
   * Adds a translation job to the queue
   * This is the ONLY method that should be used to add translation jobs in the entire system
   */
  async addTranslationJob(params: {
    messageId: string;
    chatId: string;
    content: string;
    sourceLanguage: string;
    targetLanguage: string;
  }): Promise<void> {
    const { messageId, chatId, content, sourceLanguage, targetLanguage } = params;
    
    this.logger.log(`Adding translation job for message ${messageId} from ${sourceLanguage} to ${targetLanguage}`);
    
    // Create the translation job in the standard format
    const translationJob: TranslationRequestDto = {
      messageId,
      originalText: content,
      sourceLanguage,
      targetLanguage,
      chatId
    };
    
    // Add the job to the queue
    await this.translationQueue.add(
      ProcessorNames.TRANSLATE, 
      translationJob, 
      DEFAULT_JOB_OPTIONS
    );
    
    this.logger.log(`Translation job for message ${messageId} added to queue`);
  }
}
