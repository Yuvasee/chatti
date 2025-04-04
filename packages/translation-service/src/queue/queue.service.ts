import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bull';
import { 
  TranslationRequestDto, 
  QueueNames, 
  ProcessorNames,
  DEFAULT_JOB_OPTIONS 
} from '@chatti/shared-types';

@Injectable()
export class QueueService {
  private readonly queueName: string;

  constructor(
    @InjectQueue(QueueNames.TRANSLATION)
    private translationQueue: Queue,
    private configService: ConfigService,
  ) {
    this.queueName = this.configService.get<string>('queue.translation') || QueueNames.TRANSLATION;
  }

  /**
   * Add a translation job to the queue
   */
  async addTranslationJob(job: TranslationRequestDto) {
    return this.translationQueue.add(ProcessorNames.TRANSLATE, job, DEFAULT_JOB_OPTIONS);
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
