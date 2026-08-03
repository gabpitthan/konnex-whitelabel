const DEFAULT_STALE_MS = 15 * 60 * 1000;
const MIN_STALE_MS = 60 * 1000;
const MAX_STALE_MS = 7 * 24 * 60 * 60 * 1000;

export const getDispatchReconciliationStaleMs = (): number => {
  const parsed = Number(process.env.DISPATCH_RECONCILIATION_STALE_MS);
  if (!Number.isFinite(parsed)) return DEFAULT_STALE_MS;
  return Math.max(MIN_STALE_MS, Math.min(MAX_STALE_MS, Math.trunc(parsed)));
};
