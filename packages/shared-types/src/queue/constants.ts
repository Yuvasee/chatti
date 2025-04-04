/**
 * Constants for queue configuration
 */

export enum QueueNames {
  TRANSLATION = 'translation',
}

export enum ProcessorNames {
  TRANSLATE = 'translate',
}

export const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 5000,
  },
  removeOnComplete: true,
  removeOnFail: false,
}; 