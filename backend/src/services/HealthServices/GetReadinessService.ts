import sequelize from "../../database";
import cacheLayer from "../../libs/cache";
import { isApplicationDraining } from "../../libs/shutdownState";

export interface ReadinessDependencies {
  checkDatabase: () => Promise<void>;
  checkRedis: () => Promise<void>;
  isDraining: () => boolean;
  timeoutMs: number;
}

export interface ReadinessResult {
  ready: boolean;
  checks: {
    application: "up" | "draining";
    database: "up" | "down";
    redis: "up" | "down";
  };
}

const withTimeout = async (
  operation: () => Promise<void>,
  timeoutMs: number
): Promise<boolean> => {
  let timer: NodeJS.Timeout | undefined;
  try {
    await Promise.race([
      operation(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("READINESS_CHECK_TIMEOUT")),
          timeoutMs
        );
        timer.unref();
      })
    ]);
    return true;
  } catch {
    return false;
  } finally {
    if (timer) clearTimeout(timer);
  }
};

const defaults: ReadinessDependencies = {
  checkDatabase: async () => {
    await sequelize.query("SELECT 1");
  },
  checkRedis: () => cacheLayer.ping(),
  isDraining: isApplicationDraining,
  timeoutMs: 1_000
};

const GetReadinessService = async (
  dependencies: ReadinessDependencies = defaults
): Promise<ReadinessResult> => {
  const draining = dependencies.isDraining();
  const [database, redis] = await Promise.all([
    withTimeout(dependencies.checkDatabase, dependencies.timeoutMs),
    withTimeout(dependencies.checkRedis, dependencies.timeoutMs)
  ]);

  return {
    ready: !draining && database && redis,
    checks: {
      application: draining ? "draining" : "up",
      database: database ? "up" : "down",
      redis: redis ? "up" : "down"
    }
  };
};

export default GetReadinessService;
