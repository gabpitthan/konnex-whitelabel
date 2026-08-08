/**
 * Composicao das filas Bull a partir das definicoes de job.
 *
 * Morava em `libs/queue.ts`, onde importava `../jobs` — infraestrutura
 * dependendo da camada de aplicacao. Era a ultima das nove arestas que
 * fechavam o ciclo de 133 arquivos (HEALTH-003).
 *
 * O modulo nunca foi infraestrutura: ele so existe para casar handlers de job
 * com filas, e e consumido por servicos. Pertence a `jobs/`.
 */
import 'dotenv/config';
import BullQueue from 'bull';
import { REDIS_URI_MSG_CONN } from "../config/redis";
import configLoader from '../services/ConfigLoaderService/configLoaderService';
import * as jobs from './index';
import { closeBullQueues, QUEUE_RETENTION, registerQueueTelemetry } from '../libs/queueReliability';

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
