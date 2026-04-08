// ═══════════════════════════════════════════════
// In-memory cache with TTL support
// Extracted from: /src/app/api/market/route.ts
// ═══════════════════════════════════════════════

const cache = new Map<string, { data: unknown; timestamp: number }>();

/**
 * Retrieve a cached value by key.
 * Returns null if the key is not found or the entry has expired past `ttlMs`.
 */
export function getCache<T>(key: string, ttlMs: number): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > ttlMs) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

/**
 * Store a value in the cache with the current timestamp.
 * Use `getCache` with the desired TTL to retrieve it later.
 */
export function setCache<T>(key: string, value: T): void {
  cache.set(key, { data: value, timestamp: Date.now() });
}
