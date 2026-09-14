type CacheEntry = {
  value?: unknown;
  expiresAt?: number;
  request?: Promise<unknown>;
};

type CacheOptions<T> = {
  cacheIf?: (value: T) => boolean;
};

const MAX_ENTRIES = 100;
const queryCache = new Map<string, CacheEntry>();

function trimCache() {
  while (queryCache.size > MAX_ENTRIES) {
    const oldestKey = queryCache.keys().next().value as string | undefined;
    if (!oldestKey) return;
    queryCache.delete(oldestKey);
  }
}

/**
 * Keeps public, non-user-specific query results in memory for one browser tab.
 * Failed requests are never cached, and concurrent calls for the same key share
 * one request.
 */
export function getCachedQuery<T>(
  key: string,
  ttlMs: number,
  load: () => Promise<T>,
  options: CacheOptions<T> = {},
) {
  const current = queryCache.get(key);
  if (
    current &&
    "value" in current &&
    current.expiresAt !== undefined &&
    current.expiresAt > Date.now()
  ) {
    return Promise.resolve(current.value as T);
  }
  if (current?.request) return current.request as Promise<T>;

  const request = load()
    .then((value) => {
      if (options.cacheIf?.(value) === false) {
        queryCache.delete(key);
        return value;
      }
      queryCache.set(key, { value, expiresAt: Date.now() + ttlMs });
      trimCache();
      return value;
    })
    .catch((error: unknown) => {
      queryCache.delete(key);
      throw error;
    });

  queryCache.set(key, { request });
  return request;
}

export function invalidateCachedQueries(prefix: string) {
  for (const key of queryCache.keys()) {
    if (key.startsWith(prefix)) queryCache.delete(key);
  }
}
