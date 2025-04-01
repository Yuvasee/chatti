import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';

interface TranslationJobData {
  messageId: string;
  chatId: string;
  content: string;
  sourceLanguage: string;
  targetLanguage: string;
}

@Injectable()
export class TranslationProducerService {
  constructor(@InjectQueue('translation') private translationQueue: Queue) {}

  async addTranslationJob(data: TranslationJobData): Promise<void> {
    await this.translationQueue.add('translate', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });
  }
}
