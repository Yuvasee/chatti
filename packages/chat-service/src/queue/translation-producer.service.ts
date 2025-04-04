import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { ChatTranslationRequestDto } from '@chatti/shared-types';

@Injectable()
export class TranslationProducerService {
  private readonly queueName: string;

  constructor(
    @InjectQueue('translation') 
    private translationQueue: Queue,
    private configService: ConfigService,
  ) {
    this.queueName = this.configService.get<string>('queue.translation') || 'translation';
  }

  async addTranslationJob(data: ChatTranslationRequestDto): Promise<void> {
    await this.translationQueue.add('translate', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });
  }
}
