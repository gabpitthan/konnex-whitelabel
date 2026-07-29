interface RedisScanner {
  scan(
    cursor: string,
    matchToken: "MATCH",
    pattern: string,
    countToken: "COUNT",
    count: number
  ): Promise<[string, string[]]>;
  unlink(...keys: string[]): Promise<number>;
}

interface UnlinkPatternOptions {
  count?: number;
  batchSize?: number;
  maxPasses?: number;
}

const chunk = <T>(items: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

export const unlinkRedisPattern = async (
  redis: RedisScanner,
  pattern: string,
  options: UnlinkPatternOptions = {}
): Promise<number> => {
  const count = Math.max(10, Math.min(options.count || 100, 1000));
  const batchSize = Math.max(10, Math.min(options.batchSize || 100, 500));
  const maxPasses = Math.max(1, Math.min(options.maxPasses || 2, 3));
  let removed = 0;

  for (let pass = 0; pass < maxPasses; pass += 1) {
    let cursor = "0";
    let foundInPass = 0;

    do {
      // SCAN is cursor-dependent and must remain sequential.
      // eslint-disable-next-line no-await-in-loop
      const [nextCursor, keys] = await redis.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        count
      );
      cursor = nextCursor;
      const uniqueKeys = [...new Set(keys)];
      foundInPass += uniqueKeys.length;

      const keyBatches = chunk(uniqueKeys, batchSize);
      for (
        let batchIndex = 0;
        batchIndex < keyBatches.length;
        batchIndex += 1
      ) {
        // Preserve bounded Redis pressure instead of dispatching every batch.
        // eslint-disable-next-line no-await-in-loop
        removed += await redis.unlink(...keyBatches[batchIndex]);
      }
    } while (cursor !== "0");

    if (foundInPass === 0) break;
  }

  return removed;
};
