import {
  ACQUIRE_WHATSAPP_LEASE_SCRIPT,
  CHECK_WHATSAPP_LEASE_SCRIPT,
  DELETE_WITH_WHATSAPP_LEASE_SCRIPT,
  RELEASE_WHATSAPP_LEASE_SCRIPT,
  RENEW_WHATSAPP_LEASE_SCRIPT,
  SET_WITH_WHATSAPP_LEASE_SCRIPT,
  WhatsAppLeaseLostError,
  WhatsAppLeaseScheduler,
  WhatsAppLeaseUnavailableError,
  createWhatsAppLeaseManager,
  whatsappLeaseKey
} from "../whatsappLease";

const owner = { companyId: 2, whatsappId: 7 };

class InMemoryLeaseRedis {
  readonly values = new Map<string, string>();

  fail = false;

  async eval(
    script: string,
    _numberOfKeys: number,
    key: string,
    valueOrDataKey: string,
    expectedOrPayload?: string
  ): Promise<number> {
    if (this.fail) throw new Error("REDIS_DOWN");
    const value =
      script === SET_WITH_WHATSAPP_LEASE_SCRIPT ||
      script === DELETE_WITH_WHATSAPP_LEASE_SCRIPT
        ? expectedOrPayload!
        : valueOrDataKey;
    if (script === ACQUIRE_WHATSAPP_LEASE_SCRIPT) {
      if (this.values.has(key)) return 0;
      this.values.set(key, value);
      return 1;
    }
    if (script === RENEW_WHATSAPP_LEASE_SCRIPT) {
      return this.values.get(key) === value ? 1 : 0;
    }
    if (script === CHECK_WHATSAPP_LEASE_SCRIPT) {
      return this.values.get(key) === value ? 1 : 0;
    }
    if (script === RELEASE_WHATSAPP_LEASE_SCRIPT) {
      if (this.values.get(key) !== value) return 0;
      this.values.delete(key);
      return 1;
    }
    if (script === SET_WITH_WHATSAPP_LEASE_SCRIPT) {
      if (this.values.get(key) !== expectedOrPayload) return 0;
      this.values.set(valueOrDataKey, arguments[5] as string);
      return 1;
    }
    if (script === DELETE_WITH_WHATSAPP_LEASE_SCRIPT) {
      if (this.values.get(key) !== expectedOrPayload) return 0;
      this.values.delete(valueOrDataKey);
      return 1;
    }
    throw new Error("UNKNOWN_SCRIPT");
  }
}

class ManualScheduler implements WhatsAppLeaseScheduler {
  callback?: () => void;

  cleared = false;

  intervalMs?: number;

  setInterval(callback: () => void, intervalMs: number): unknown {
    this.callback = callback;
    this.intervalMs = intervalMs;
    return 1;
  }

  clearInterval(): void {
    this.cleared = true;
    this.callback = undefined;
  }

  tick(): void {
    this.callback?.();
  }
}

const flushPromises = (): Promise<void> =>
  new Promise(resolve => setImmediate(resolve));

describe("distributed WhatsApp lease", () => {
  it("uses a tenant-aware key", () => {
    expect(whatsappLeaseKey(owner)).toBe("whatsapp:lease:{2:7}");
    expect(whatsappLeaseKey({ companyId: 3, whatsappId: 7 })).not.toBe(
      whatsappLeaseKey(owner)
    );
  });

  it("acquires atomically with a repository-provided fence", async () => {
    const redis = new InMemoryLeaseRedis();
    const nextFence = jest.fn().mockResolvedValue("9007199254740993");
    const manager = createWhatsAppLeaseManager({
      redis,
      fenceRepository: { nextFence },
      createToken: () => "owner-a"
    });

    const lease = await manager.acquire(owner);

    expect(lease.fence).toBe("9007199254740993");
    expect(lease.token).toBe("owner-a");
    expect(lease.isOwned()).toBe(true);
    expect(nextFence).toHaveBeenCalledWith(owner);
    await expect(lease.assertOwned()).resolves.toBeUndefined();
  });

  it("allows only one owner and keeps equal ids from different tenants separate", async () => {
    const redis = new InMemoryLeaseRedis();
    let fence = 0;
    const manager = createWhatsAppLeaseManager({
      redis,
      fenceRepository: { nextFence: async () => String(++fence) },
      createToken: () => `owner-${fence}`
    });

    await manager.acquire(owner);
    await expect(manager.acquire(owner)).rejects.toBeInstanceOf(
      WhatsAppLeaseUnavailableError
    );
    await expect(
      manager.acquire({ companyId: 3, whatsappId: owner.whatsappId })
    ).resolves.toBeDefined();
  });

  it("renews and releases only while the exact token and fence own the key", async () => {
    const redis = new InMemoryLeaseRedis();
    const manager = createWhatsAppLeaseManager({
      redis,
      fenceRepository: { nextFence: async () => "41" },
      createToken: () => "owner-a"
    });
    const lease = await manager.acquire(owner);

    await expect(lease.renew()).resolves.toBeUndefined();
    redis.values.set(
      whatsappLeaseKey(owner),
      JSON.stringify({ token: "owner-b", fence: "42" })
    );

    await expect(lease.release()).resolves.toBe(false);
    expect(redis.values.get(whatsappLeaseKey(owner))).toContain("owner-b");
    await expect(lease.assertOwned()).rejects.toBeInstanceOf(
      WhatsAppLeaseLostError
    );
  });

  it("runs a deterministic heartbeat and reports lease loss once", async () => {
    const redis = new InMemoryLeaseRedis();
    const scheduler = new ManualScheduler();
    const onLost = jest.fn();
    const manager = createWhatsAppLeaseManager({
      redis,
      fenceRepository: { nextFence: async () => "5" },
      createToken: () => "owner-a",
      ttlMs: 300,
      heartbeatIntervalMs: 100,
      scheduler
    });
    const lease = await manager.acquire(owner);
    lease.startHeartbeat(onLost);

    expect(scheduler.intervalMs).toBe(100);
    scheduler.tick();
    await flushPromises();
    expect(lease.isOwned()).toBe(true);

    redis.values.delete(whatsappLeaseKey(owner));
    scheduler.tick();
    await flushPromises();
    scheduler.tick();
    await flushPromises();

    expect(lease.isOwned()).toBe(false);
    expect(onLost).toHaveBeenCalledTimes(1);
    expect(onLost.mock.calls[0][0]).toBeInstanceOf(WhatsAppLeaseLostError);
    expect(scheduler.cleared).toBe(true);
  });

  it("conditions auth writes and deletes on the current lease", async () => {
    const redis = new InMemoryLeaseRedis();
    const manager = createWhatsAppLeaseManager({
      redis,
      fenceRepository: { nextFence: async () => "8" },
      createToken: () => "owner-a"
    });
    const lease = await manager.acquire(owner);
    const authKey = "baileys:v2:{2:7}:creds";

    await lease.setIfOwned(authKey, "payload");
    expect(redis.values.get(authKey)).toBe("payload");
    await lease.deleteIfOwned(authKey);
    expect(redis.values.has(authKey)).toBe(false);

    redis.values.set(
      whatsappLeaseKey(owner),
      JSON.stringify({ token: "owner-b", fence: "9" })
    );
    await expect(lease.setIfOwned(authKey, "stale")).rejects.toBeInstanceOf(
      WhatsAppLeaseLostError
    );
    expect(redis.values.has(authKey)).toBe(false);
  });

  it("fails closed when Redis errors during checks, renewal, or release", async () => {
    const redis = new InMemoryLeaseRedis();
    let fence = 0;
    const manager = createWhatsAppLeaseManager({
      redis,
      fenceRepository: { nextFence: async () => String(++fence) },
      createToken: () => `owner-${fence}`
    });

    const checked = await manager.acquire(owner);
    redis.fail = true;
    await expect(checked.assertOwned()).rejects.toBeInstanceOf(
      WhatsAppLeaseLostError
    );
    expect(checked.isOwned()).toBe(false);

    redis.fail = false;
    redis.values.clear();
    const renewed = await manager.acquire(owner);
    redis.fail = true;
    await expect(renewed.renew()).rejects.toBeInstanceOf(
      WhatsAppLeaseLostError
    );

    redis.fail = false;
    redis.values.clear();
    const released = await manager.acquire(owner);
    redis.fail = true;
    await expect(released.release()).rejects.toBeInstanceOf(
      WhatsAppLeaseLostError
    );
  });
});
