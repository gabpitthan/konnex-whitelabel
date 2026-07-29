import AppError from "../errors/AppError";

type ShutdownPhase = "running" | "draining" | "closed";

let phase: ShutdownPhase = "running";

export const applicationShutdownPhase = (): ShutdownPhase => phase;

export const isApplicationDraining = (): boolean => phase !== "running";

export const assertApplicationRunning = (): void => {
  if (isApplicationDraining()) {
    throw new AppError("APP_SHUTTING_DOWN", 503);
  }
};

export const beginApplicationDrain = (): boolean => {
  if (phase !== "running") return false;
  phase = "draining";
  return true;
};

export const completeApplicationShutdown = (): void => {
  phase = "closed";
};

export const resetApplicationShutdownForTests = (): void => {
  phase = "running";
};
