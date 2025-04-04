import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bull';
import { TranslationJobDto } from '@chatti/shared-types';

@Injectable()
export class QueueService {
  private readonly queueName: string;

  constructor(
    @InjectQueue('translation')
    private translationQueue: Queue,
    private configService: ConfigService,
  ) {
    this.queueName = this.configService.get<string>('queue.translation') || 'translation';
  }

  /**
   * Add a translation job to the queue
   */
  async addTranslationJob(job: TranslationJobDto) {
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
