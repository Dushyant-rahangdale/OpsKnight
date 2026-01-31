type RateLimitState = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitState>();

// Cleanup configuration
const CLEANUP_INTERVAL_MS = 60_000; // Run cleanup every 60 seconds
const MAX_STORE_SIZE = 10_000; // Force cleanup if store exceeds this size
let lastCleanup = Date.now();

/**
 * Remove expired entries from the rate limit store
 * This prevents unbounded memory growth on long-running servers
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  let cleanedCount = 0;

  for (const [key, state] of store) {
    if (now >= state.resetAt) {
      store.delete(key);
      cleanedCount++;
    }
  }

  lastCleanup = now;
}

/**
 * Check if cleanup should run based on time or store size
 */
function maybeCleanup(): void {
  const now = Date.now();
  const timeSinceLastCleanup = now - lastCleanup;

  // Cleanup if interval has passed OR store is too large
  if (timeSinceLastCleanup >= CLEANUP_INTERVAL_MS || store.size > MAX_STORE_SIZE) {
    cleanupExpiredEntries();
  }
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number; count: number } {
  // Periodically clean up expired entries to prevent memory leaks
  maybeCleanup();

  const now = Date.now();
  const current = store.get(key);

  if (!current || now >= current.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs, count: 1 };
  }

  if (current.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt, count: current.count };
  }

  const next = { count: current.count + 1, resetAt: current.resetAt };
  store.set(key, next);
  return { allowed: true, remaining: limit - next.count, resetAt: next.resetAt, count: next.count };
}

/**
 * Get current store size (for monitoring/debugging)
 */
export function getRateLimitStoreSize(): number {
  return store.size;
}

/**
 * Force cleanup of expired entries (for testing or manual trigger)
 */
export function forceCleanup(): number {
  const sizeBefore = store.size;
  cleanupExpiredEntries();
  return sizeBefore - store.size;
}
