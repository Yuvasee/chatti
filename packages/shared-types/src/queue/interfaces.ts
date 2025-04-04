/**
 * Interfaces for queue configuration
 */

import { JobsOptions } from 'bullmq';

export interface QueueConfig {
  redis: {
    host: string;
    port: number;
  };
  queues: {
    translation: string;
  };
}

export interface QueueJobOptions extends JobsOptions {
  attempts: number;
  backoff: {
    type: 'exponential';
    delay: number;
  };
  removeOnComplete: boolean;
  removeOnFail: boolean;
} 