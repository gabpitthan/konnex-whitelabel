jest.mock("../../../database", () => ({
  __esModule: true,
  default: { query: jest.fn() }
}));
jest.mock("../../../libs/cache", () => ({
  __esModule: true,
  default: { ping: jest.fn() }
}));

import GetReadinessService, {
  ReadinessDependencies
} from "../GetReadinessService";

const dependencies = (
  overrides: Partial<ReadinessDependencies> = {}
): ReadinessDependencies => ({
  checkDatabase: async () => undefined,
  checkRedis: async () => undefined,
  isDraining: () => false,
  timeoutMs: 50,
  ...overrides
});

describe("GetReadinessService", () => {
  it("is ready only when application, PostgreSQL and Redis are ready", async () => {
    await expect(GetReadinessService(dependencies())).resolves.toEqual({
      ready: true,
      checks: {
        application: "up",
        database: "up",
        redis: "up"
      }
    });
  });

  it("fails readiness without leaking dependency errors", async () => {
    await expect(
      GetReadinessService(
        dependencies({
          checkRedis: async () => {
            throw new Error("secret connection detail");
          }
        })
      )
    ).resolves.toEqual({
      ready: false,
      checks: {
        application: "up",
        database: "up",
        redis: "down"
      }
    });
  });

  it("fails closed while the process is draining", async () => {
    const result = await GetReadinessService(
      dependencies({ isDraining: () => true })
    );
    expect(result.ready).toBe(false);
    expect(result.checks.application).toBe("draining");
  });
});
