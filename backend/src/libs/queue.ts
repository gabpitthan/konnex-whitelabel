import 'dotenv/config';
import BullQueue from 'bull';
import { REDIS_URI_MSG_CONN } from "../config/redis";
import configLoader from '../services/ConfigLoaderService/configLoaderService';
import * as jobs from '../jobs';
import { closeBullQueues, QUEUE_RETENTION, registerQueueTelemetry } from './queueReliability';

const config = configLoader(); // Carregue as configurações

const queueOptions = {
  defaultJobOptions: {
    attempts: config.webhook.attempts,
    backoff: {
      type: config.webhook.backoff.type,
      delay: config.webhook.backoff.delay,
    },
    removeOnFail: QUEUE_RETENTION.failed,
    removeOnComplete: QUEUE_RETENTION.completed,
  },
  limiter: {
    max: config.webhook.limiter.max,
    duration: config.webhook.limiter.duration,
  },
};

const queues = REDIS_URI_MSG_CONN === "" ? [] : Object.values(jobs).reduce((acc, job) => {
  const bull = new BullQueue(job.key, REDIS_URI_MSG_CONN, queueOptions);
  registerQueueTelemetry(bull);
  acc.push({
    bull,
    name: job.key,
    handle: job.handle,
  });
  return acc;
}, []);

export default {
  queues,
  add(name: string, data, params = {}) {
    const queue = this.queues.find(queue => queue.name === name);

    if (!queue) {
      throw new Error(`Queue ${name} not found`);
    }

    return queue.bull.add(data, params);
  },
  process() {
    return this.queues.forEach(queue => {
      queue.bull.process(queue.handle);
    })
  },
  close() {
    return closeBullQueues(this.queues.map(queue => queue.bull));
  }
}
