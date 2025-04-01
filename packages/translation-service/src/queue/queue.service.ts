import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bull';

export interface TranslationJob {
  messageId: string;
  originalText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue(process.env.TRANSLATION_QUEUE || 'translation-queue')
    private translationQueue: Queue,
    private configService: ConfigService,
  ) {}

  /**
   * Add a translation job to the queue
   */
  async addTranslationJob(job: TranslationJob) {
    return this.translationQueue.add('translate', job, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    });
  }

  /**
   * Get the current count of jobs in the queue
   */
  async getQueueCount() {
    const [waiting, active, completed, failed] = await Promise.all([
      this.translationQueue.getWaitingCount(),
      this.translationQueue.getActiveCount(),
      this.translationQueue.getCompletedCount(),
      this.translationQueue.getFailedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      total: waiting + active + completed + failed,
    };
  }
}
