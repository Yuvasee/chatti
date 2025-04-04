import { QueueNames } from '../queue';

/**
 * Standard Redis configuration for BullMQ
 */
export const getRedisConfig = (host: string, port: number) => {
  return {
    url: `redis://${host}:${port}`,
  };
};

/**
 * Standard Queue configuration for all services
 */
export const getQueueConfig = (queueName: string = QueueNames.TRANSLATION) => {
  return {
    name: queueName,
  };
}; 