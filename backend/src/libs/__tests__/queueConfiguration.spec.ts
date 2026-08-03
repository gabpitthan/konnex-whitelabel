jest.mock("bull", () => jest.fn());
jest.mock("../../config/redis", () => ({ REDIS_URI_MSG_CONN: "" }));
jest.mock("../../jobs", () => ({
  sample: { key: "sample", handle: jest.fn() }
}));

import BullQueues from "../queue";

describe("optional ACK queues", () => {
  it("does not create Redis clients when REDIS_URI_ACK is disabled", () => {
    expect(BullQueues.queues).toEqual([]);
  });

  it("fails explicitly if a producer targets a disabled queue", () => {
    expect(() => BullQueues.add("sample", {})).toThrow("Queue sample not found");
  });
});
