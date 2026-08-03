import { EventEmitter } from "events";

const info = jest.fn();
const warn = jest.fn();
const error = jest.fn();

jest.mock("../../utils/logger", () => ({
  __esModule: true,
  default: { info, warn, error }
}));

import {
  closeBullQueues,
  QUEUE_RETENTION,
  registerQueueTelemetry
} from "../queueReliability";

class FakeQueue extends EventEmitter {
  public close = jest.fn().mockResolvedValue(undefined);
  constructor(public name: string) {
    super();
  }
}

describe("Bull queue reliability", () => {
  beforeEach(() => jest.clearAllMocks());

  it("uses bounded completed and failed retention", () => {
    expect(QUEUE_RETENTION.completed).toEqual({ age: 3600, count: 100 });
    expect(QUEUE_RETENTION.failed).toEqual({ age: 604800, count: 500 });
  });

  it("logs failed and stalled jobs without serializing payload data", () => {
    const queue = new FakeQueue("MessageQueue");
    registerQueueTelemetry(queue as any);
    const job = {
      id: "safe-id",
      name: "SendMessage",
      attemptsMade: 2,
      opts: { attempts: 3 },
      data: { body: "PRIVATE MESSAGE", token: "SECRET" }
    };

    queue.emit("failed", job, new TypeError("PRIVATE ERROR"));
    queue.emit("stalled", job);

    const serialized = JSON.stringify({ error: error.mock.calls, warn: warn.mock.calls });
    expect(serialized).toContain("bull_job_failed");
    expect(serialized).toContain("bull_job_stalled");
    expect(serialized).toContain("TypeError");
    expect(serialized).toContain("jobIdPresent");
    expect(serialized).not.toContain("safe-id");
    expect(serialized).not.toContain("PRIVATE MESSAGE");
    expect(serialized).not.toContain("SECRET");
    expect(serialized).not.toContain("PRIVATE ERROR");
  });

  it("does not register duplicate listeners", () => {
    const queue = new FakeQueue("QueueMonitor");
    registerQueueTelemetry(queue as any);
    registerQueueTelemetry(queue as any);
    expect(queue.listenerCount("failed")).toBe(1);
  });

  it("closes unique queues and reports the aggregate result", async () => {
    const first = new FakeQueue("first");
    const second = new FakeQueue("second");

    await closeBullQueues([first, first, second] as any);

    expect(first.close).toHaveBeenCalledTimes(1);
    expect(second.close).toHaveBeenCalledTimes(1);
    expect(info).toHaveBeenCalledWith({
      event: "bull_queues_closed",
      queueCount: 2,
      failedCount: 0
    });
  });

  it("fails shutdown when any queue cannot close", async () => {
    const queue = new FakeQueue("failed");
    queue.close.mockRejectedValueOnce(new Error("redis unavailable"));
    await expect(closeBullQueues([queue] as any)).rejects.toThrow(
      "BULL_QUEUE_SHUTDOWN_FAILED"
    );
  });
});
