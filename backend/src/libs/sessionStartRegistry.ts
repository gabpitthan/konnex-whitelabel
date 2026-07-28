interface SessionOwner {
  whatsappId: number;
  companyId: number;
}

const starts = new Map<string, Promise<void>>();
const generations = new Map<string, number>();
const activeGenerations = new Map<string, number>();

export const sessionOwnerKey = ({
  whatsappId,
  companyId
}: SessionOwner): string => `${companyId}:${whatsappId}`;

export const runSessionStartSingleFlight = (
  owner: SessionOwner,
  starter: () => Promise<void>
): Promise<void> => {
  const key = sessionOwnerKey(owner);
  const active = starts.get(key);
  if (active) return active;

  const start = starter().finally(() => {
    if (starts.get(key) === start) starts.delete(key);
  });
  starts.set(key, start);
  return start;
};

export const hasSessionStartInFlight = (owner: SessionOwner): boolean =>
  starts.has(sessionOwnerKey(owner));

export const clearSessionStartRegistryForTests = (): void => starts.clear();

export const activateSessionGeneration = (owner: SessionOwner): number => {
  const key = sessionOwnerKey(owner);
  const generation = (generations.get(key) || 0) + 1;
  generations.set(key, generation);
  activeGenerations.set(key, generation);
  return generation;
};

export const isCurrentSessionGeneration = (
  owner: SessionOwner,
  generation: number
): boolean => activeGenerations.get(sessionOwnerKey(owner)) === generation;

export const invalidateSessionGeneration = (
  owner: SessionOwner,
  generation?: number
): void => {
  const key = sessionOwnerKey(owner);
  if (
    generation === undefined ||
    activeGenerations.get(key) === generation
  ) {
    activeGenerations.delete(key);
  }
};

export const clearSessionLifecycleRegistryForTests = (): void => {
  starts.clear();
  generations.clear();
  activeGenerations.clear();
};
