import Queue from "bull";
import logger from "../utils/logger";

export const QUEUE_RETENTION = Object.freeze({
  completed: Object.freeze({ age: 60 * 60, count: 100 }),
  failed: Object.freeze({ age: 7 * 24 * 60 * 60, count: 500 })
});

const instrumentedQueues = new WeakSet<object>();

const safeJobFields = (queue: Queue.Queue, job: Queue.Job | undefined) => ({
  queue: queue.name,
  jobName: job?.name || "unknown",
  jobIdPresent: job?.id !== undefined,
  attemptsMade: job?.attemptsMade || 0,
  attemptsConfigured: job?.opts?.attempts || 1
});

export const registerQueueTelemetry = (queue: Queue.Queue): void => {
  if (instrumentedQueues.has(queue)) return;
  instrumentedQueues.add(queue);

  queue.on("failed", (job, error) => {
    logger.error({
      event: "bull_job_failed",
      ...safeJobFields(queue, job),
      errorClass: error instanceof Error ? error.name : "UnknownError"
    });
  });

  queue.on("stalled", job => {
    logger.warn({
      event: "bull_job_stalled",
      ...safeJobFields(queue, job)
    });
  });

  queue.on("error", error => {
    logger.error({
      event: "bull_queue_error",
      queue: queue.name,
      errorClass: error instanceof Error ? error.name : "UnknownError"
    });
  });
};

export const closeBullQueues = async (queues: Queue.Queue[]): Promise<void> => {
  const uniqueQueues = Array.from(new Set(queues));
  const results = await Promise.allSettled(uniqueQueues.map(queue => queue.close()));
  const failed = results.filter(result => result.status === "rejected").length;

  logger.info({
    event: "bull_queues_closed",
    queueCount: uniqueQueues.length,
    failedCount: failed
  });

  if (failed > 0) {
    throw new Error("BULL_QUEUE_SHUTDOWN_FAILED");
  }
};
