import { unlinkRedisPattern } from "../redisPattern";

describe("Redis pattern cleanup", () => {
  it("continues through empty pages until the cursor reaches zero", async () => {
    const scan = jest
      .fn()
      .mockResolvedValueOnce(["12", []])
      .mockResolvedValueOnce(["0", ["target:1", "target:2"]])
      .mockResolvedValueOnce(["0", []]);
    const unlink = jest.fn().mockResolvedValue(2);

    await expect(
      unlinkRedisPattern({ scan, unlink }, "target:*")
    ).resolves.toBe(2);
    expect(scan).toHaveBeenCalledTimes(3);
    expect(unlink).toHaveBeenCalledWith("target:1", "target:2");
  });

  it("deduplicates keys and chunks UNLINK operations", async () => {
    const keys = Array.from({ length: 25 }, (_, index) => `target:${index}`);
    const scan = jest
      .fn()
      .mockResolvedValueOnce(["0", [...keys, keys[0]]])
      .mockResolvedValueOnce(["0", []]);
    const unlink = jest.fn(async (...batch: string[]) => batch.length);

    await expect(
      unlinkRedisPattern({ scan, unlink }, "target:*", { batchSize: 10 })
    ).resolves.toBe(25);
    expect(unlink).toHaveBeenCalledTimes(3);
  });

  it("propagates scan and unlink failures", async () => {
    await expect(
      unlinkRedisPattern(
        {
          scan: jest.fn().mockRejectedValue(new Error("REDIS_DOWN")),
          unlink: jest.fn(),
        },
        "target:*"
      )
    ).rejects.toThrow("REDIS_DOWN");

    await expect(
      unlinkRedisPattern(
        {
          scan: jest.fn().mockResolvedValue(["0", ["target:1"]]),
          unlink: jest.fn().mockRejectedValue(new Error("UNLINK_FAILED")),
        },
        "target:*"
      )
    ).rejects.toThrow("UNLINK_FAILED");
  });
});
