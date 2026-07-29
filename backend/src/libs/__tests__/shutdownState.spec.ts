import {
  applicationShutdownPhase,
  assertApplicationRunning,
  beginApplicationDrain,
  completeApplicationShutdown,
  isApplicationDraining,
  resetApplicationShutdownForTests,
} from "../shutdownState";

describe("application shutdown state", () => {
  beforeEach(resetApplicationShutdownForTests);

  it("moves monotonically from running to draining to closed", () => {
    expect(() => assertApplicationRunning()).not.toThrow();
    expect(isApplicationDraining()).toBe(false);
    expect(beginApplicationDrain()).toBe(true);
    expect(() => assertApplicationRunning()).toThrow("APP_SHUTTING_DOWN");
    expect(beginApplicationDrain()).toBe(false);
    expect(applicationShutdownPhase()).toBe("draining");
    completeApplicationShutdown();
    expect(applicationShutdownPhase()).toBe("closed");
    expect(isApplicationDraining()).toBe(true);
  });
});
