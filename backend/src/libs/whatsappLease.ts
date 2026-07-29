export interface WhatsAppLeaseOwner {
  companyId: number;
  whatsappId: number;
}

export interface WhatsAppLeaseRedis {
  eval(
    script: string,
    numberOfKeys: number,
    ...args: string[]
  ): Promise<unknown>;
}

export interface WhatsAppFenceRepository {
  nextFence(owner: WhatsAppLeaseOwner): Promise<string | number | bigint>;
}

export interface WhatsAppLeaseScheduler {
  setInterval(callback: () => void, intervalMs: number): unknown;
  clearInterval(handle: unknown): void;
}

export interface WhatsAppLeaseManagerOptions {
  redis: WhatsAppLeaseRedis;
  fenceRepository: WhatsAppFenceRepository;
  createToken: () => string;
  ttlMs?: number;
  heartbeatIntervalMs?: number;
  scheduler?: WhatsAppLeaseScheduler;
}

export const ACQUIRE_WHATSAPP_LEASE_SCRIPT = `
-- whatsapp-lease:acquire
if redis.call("EXISTS", KEYS[1]) == 0 then
  local result = redis.call("SET", KEYS[1], ARGV[1], "PX", ARGV[2], "NX")
  if result then
    return 1
  end
end
return 0
`;

export const RENEW_WHATSAPP_LEASE_SCRIPT = `
-- whatsapp-lease:renew
if redis.call("GET", KEYS[1]) == ARGV[1] then
  redis.call("PEXPIRE", KEYS[1], ARGV[2])
  return 1
end
return 0
`;

export const CHECK_WHATSAPP_LEASE_SCRIPT = `
-- whatsapp-lease:check
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return 1
end
return 0
`;

export const RELEASE_WHATSAPP_LEASE_SCRIPT = `
-- whatsapp-lease:release
if redis.call("GET", KEYS[1]) == ARGV[1] then
  redis.call("DEL", KEYS[1])
  return 1
end
return 0
`;

export const SET_WITH_WHATSAPP_LEASE_SCRIPT = `
-- whatsapp-lease:set-owned
if redis.call("GET", KEYS[1]) == ARGV[1] then
  redis.call("SET", KEYS[2], ARGV[2])
  return 1
end
return 0
`;

export const DELETE_WITH_WHATSAPP_LEASE_SCRIPT = `
-- whatsapp-lease:delete-owned
if redis.call("GET", KEYS[1]) == ARGV[1] then
  redis.call("DEL", KEYS[2])
  return 1
end
return 0
`;

const DEFAULT_TTL_MS = 30_000;
const DEFAULT_HEARTBEAT_INTERVAL_MS = 10_000;

const defaultScheduler: WhatsAppLeaseScheduler = {
  setInterval: (callback, intervalMs) => setInterval(callback, intervalMs),
  clearInterval: handle => clearInterval(handle as NodeJS.Timeout)
};

export class WhatsAppLeaseUnavailableError extends Error {
  constructor(readonly owner: WhatsAppLeaseOwner) {
    super("WHATSAPP_LEASE_UNAVAILABLE");
    this.name = "WhatsAppLeaseUnavailableError";
  }
}

export class WhatsAppLeaseLostError extends Error {
  constructor(readonly owner: WhatsAppLeaseOwner) {
    super("WHATSAPP_LEASE_LOST");
    this.name = "WhatsAppLeaseLostError";
  }
}

const assertOwner = (owner: WhatsAppLeaseOwner): void => {
  if (
    !Number.isInteger(owner.companyId) ||
    owner.companyId <= 0 ||
    !Number.isInteger(owner.whatsappId) ||
    owner.whatsappId <= 0
  ) {
    throw new Error("WHATSAPP_LEASE_INVALID_OWNER");
  }
};

const normalizeFence = (fence: string | number | bigint): string => {
  const normalized = String(fence);
  if (!/^[1-9]\d*$/.test(normalized)) {
    throw new Error("WHATSAPP_LEASE_INVALID_FENCE");
  }
  return normalized;
};

const isSuccess = (result: unknown): boolean =>
  result === 1 || result === "1";

export const whatsappLeaseKey = (owner: WhatsAppLeaseOwner): string => {
  assertOwner(owner);
  return `whatsapp:lease:{${owner.companyId}:${owner.whatsappId}}`;
};

export class WhatsAppLease {
  readonly key: string;

  private state: "owned" | "releasing" | "lost" | "released" = "owned";

  private heartbeatHandle: unknown;

  private heartbeatRunning = false;

  private lossNotified = false;

  private onLost?: (error: WhatsAppLeaseLostError) => void;

  constructor(
    readonly owner: WhatsAppLeaseOwner,
    readonly fence: string,
    readonly token: string,
    private readonly value: string,
    private readonly redis: WhatsAppLeaseRedis,
    private readonly ttlMs: number,
    private readonly heartbeatIntervalMs: number,
    private readonly scheduler: WhatsAppLeaseScheduler
  ) {
    this.key = whatsappLeaseKey(owner);
  }

  isOwned(): boolean {
    return this.state === "owned";
  }

  private lose(): WhatsAppLeaseLostError {
    const shouldNotify = this.state === "owned";
    if (shouldNotify) this.state = "lost";
    this.stopHeartbeat();
    const error = new WhatsAppLeaseLostError(this.owner);
    if (shouldNotify && !this.lossNotified) {
      this.lossNotified = true;
      try {
        this.onLost?.(error);
      } catch {
        // Lease loss must remain fail-closed even if cleanup notification fails.
      }
    }
    return error;
  }

  private requireOwned(): void {
    if (this.state !== "owned") throw new WhatsAppLeaseLostError(this.owner);
  }

  async assertOwned(): Promise<void> {
    this.requireOwned();
    let result: unknown;
    try {
      result = await this.redis.eval(
        CHECK_WHATSAPP_LEASE_SCRIPT,
        1,
        this.key,
        this.value
      );
    } catch {
      throw this.lose();
    }
    if (!isSuccess(result)) throw this.lose();
  }

  async renew(): Promise<void> {
    this.requireOwned();
    let result: unknown;
    try {
      result = await this.redis.eval(
        RENEW_WHATSAPP_LEASE_SCRIPT,
        1,
        this.key,
        this.value,
        String(this.ttlMs)
      );
    } catch {
      throw this.lose();
    }
    if (!isSuccess(result)) throw this.lose();
  }

  async setIfOwned(key: string, payload: string): Promise<void> {
    this.requireOwned();
    let result: unknown;
    try {
      result = await this.redis.eval(
        SET_WITH_WHATSAPP_LEASE_SCRIPT,
        2,
        this.key,
        key,
        this.value,
        payload
      );
    } catch {
      throw this.lose();
    }
    if (!isSuccess(result)) throw this.lose();
  }

  async deleteIfOwned(key: string): Promise<void> {
    this.requireOwned();
    let result: unknown;
    try {
      result = await this.redis.eval(
        DELETE_WITH_WHATSAPP_LEASE_SCRIPT,
        2,
        this.key,
        key,
        this.value
      );
    } catch {
      throw this.lose();
    }
    if (!isSuccess(result)) throw this.lose();
  }

  startHeartbeat(onLost: (error: WhatsAppLeaseLostError) => void): void {
    this.requireOwned();
    if (this.heartbeatHandle !== undefined) {
      throw new Error("WHATSAPP_LEASE_HEARTBEAT_ALREADY_STARTED");
    }
    this.onLost = onLost;
    this.heartbeatHandle = this.scheduler.setInterval(() => {
      if (this.heartbeatRunning || this.state !== "owned") return;
      this.heartbeatRunning = true;
      void this.renew()
        .catch(() => undefined)
        .finally(() => {
          this.heartbeatRunning = false;
        });
    }, this.heartbeatIntervalMs);
  }

  stopHeartbeat(): void {
    if (this.heartbeatHandle !== undefined) {
      this.scheduler.clearInterval(this.heartbeatHandle);
      this.heartbeatHandle = undefined;
    }
  }

  async release(): Promise<boolean> {
    if (this.state === "released") return false;
    if (this.state === "lost") return false;
    this.stopHeartbeat();
    this.state = "releasing";

    let released: unknown;
    try {
      released = await this.redis.eval(
        RELEASE_WHATSAPP_LEASE_SCRIPT,
        1,
        this.key,
        this.value
      );
    } catch {
      this.state = "lost";
      throw new WhatsAppLeaseLostError(this.owner);
    }

    this.state = isSuccess(released) ? "released" : "lost";
    return isSuccess(released);
  }
}

export class WhatsAppLeaseManager {
  private readonly ttlMs: number;

  private readonly heartbeatIntervalMs: number;

  private readonly scheduler: WhatsAppLeaseScheduler;

  constructor(private readonly options: WhatsAppLeaseManagerOptions) {
    this.ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
    this.heartbeatIntervalMs =
      options.heartbeatIntervalMs ?? DEFAULT_HEARTBEAT_INTERVAL_MS;
    this.scheduler = options.scheduler ?? defaultScheduler;

    if (
      !Number.isInteger(this.ttlMs) ||
      this.ttlMs <= 0 ||
      !Number.isInteger(this.heartbeatIntervalMs) ||
      this.heartbeatIntervalMs <= 0 ||
      this.heartbeatIntervalMs >= this.ttlMs
    ) {
      throw new Error("WHATSAPP_LEASE_INVALID_TIMING");
    }
  }

  async acquire(owner: WhatsAppLeaseOwner): Promise<WhatsAppLease> {
    assertOwner(owner);
    const fence = normalizeFence(
      await this.options.fenceRepository.nextFence(owner)
    );
    const token = this.options.createToken();
    if (!token) throw new Error("WHATSAPP_LEASE_INVALID_TOKEN");

    const value = JSON.stringify({ token, fence });
    const key = whatsappLeaseKey(owner);
    const acquired = await this.options.redis.eval(
      ACQUIRE_WHATSAPP_LEASE_SCRIPT,
      1,
      key,
      value,
      String(this.ttlMs)
    );

    if (!isSuccess(acquired)) {
      throw new WhatsAppLeaseUnavailableError(owner);
    }

    return new WhatsAppLease(
      owner,
      fence,
      token,
      value,
      this.options.redis,
      this.ttlMs,
      this.heartbeatIntervalMs,
      this.scheduler
    );
  }
}

export const createWhatsAppLeaseManager = (
  options: WhatsAppLeaseManagerOptions
): WhatsAppLeaseManager => new WhatsAppLeaseManager(options);
