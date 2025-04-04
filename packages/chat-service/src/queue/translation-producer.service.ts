import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { 
  ChatTranslationRequestDto, 
  QueueNames, 
  ProcessorNames,
  DEFAULT_JOB_OPTIONS 
} from '@chatti/shared-types';

@Injectable()
export class TranslationProducerService {
  private readonly queueName: string;

  constructor(
    @InjectQueue(QueueNames.TRANSLATION) 
    private translationQueue: Queue,
    private configService: ConfigService,
  ) {
    this.queueName = this.configService.get<string>('queue.translation') || QueueNames.TRANSLATION;
  }

  async addTranslationJob(data: ChatTranslationRequestDto): Promise<void> {
    await this.translationQueue.add(ProcessorNames.TRANSLATE, data, DEFAULT_JOB_OPTIONS);
  }
}
