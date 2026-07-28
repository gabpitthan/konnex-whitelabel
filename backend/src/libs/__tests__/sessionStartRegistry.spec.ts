import {
  activateSessionGeneration,
  clearSessionStartRegistryForTests,
  clearSessionLifecycleRegistryForTests,
  hasSessionStartInFlight,
  invalidateSessionGeneration,
  isCurrentSessionGeneration,
  runSessionStartSingleFlight
} from "../sessionStartRegistry";

describe("WhatsApp session start single-flight", () => {
  beforeEach(clearSessionStartRegistryForTests);

  it("runs one starter for concurrent calls of the same tenant/session", async () => {
    let calls = 0;
    let release: () => void;
    const gate = new Promise<void>(resolve => {
      release = resolve;
    });
    const owner = { whatsappId: 7, companyId: 2 };
    const starter = async () => {
      calls += 1;
      await gate;
    };

    const starts = Array.from({ length: 20 }, () =>
      runSessionStartSingleFlight(owner, starter)
    );

    expect(calls).toBe(1);
    expect(hasSessionStartInFlight(owner)).toBe(true);
    release!();
    await Promise.all(starts);
    expect(hasSessionStartInFlight(owner)).toBe(false);
  });

  it("does not merge equal WhatsApp ids from different tenants", async () => {
    let calls = 0;
    await Promise.all([
      runSessionStartSingleFlight({ whatsappId: 7, companyId: 2 }, async () => {
        calls += 1;
      }),
      runSessionStartSingleFlight({ whatsappId: 7, companyId: 3 }, async () => {
        calls += 1;
      })
    ]);
    expect(calls).toBe(2);
  });

  it("clears a failed flight so the next attempt can retry", async () => {
    const owner = { whatsappId: 7, companyId: 2 };
    await expect(
      runSessionStartSingleFlight(owner, async () => {
        throw new Error("START_FAILED");
      })
    ).rejects.toThrow("START_FAILED");

    await expect(
      runSessionStartSingleFlight(owner, async () => undefined)
    ).resolves.toBeUndefined();
  });

  it("invalidates stale events after a new generation starts", () => {
    clearSessionLifecycleRegistryForTests();
    const owner = { whatsappId: 7, companyId: 2 };
    const first = activateSessionGeneration(owner);
    const second = activateSessionGeneration(owner);

    expect(isCurrentSessionGeneration(owner, first)).toBe(false);
    expect(isCurrentSessionGeneration(owner, second)).toBe(true);
    invalidateSessionGeneration(owner, first);
    expect(isCurrentSessionGeneration(owner, second)).toBe(true);
    invalidateSessionGeneration(owner, second);
    expect(isCurrentSessionGeneration(owner, second)).toBe(false);
  });
});
