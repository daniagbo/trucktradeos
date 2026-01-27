
interface RateLimitContext {
  count: number;
  expiresAt: number;
}

const trackers = new Map<string, RateLimitContext>();

/**
 * Prune expired entries to prevent memory leaks
 */
function pruneTrackers() {
  const now = Date.now();
  for (const [key, context] of trackers.entries()) {
    if (context.expiresAt < now) {
      trackers.delete(key);
    }
  }
}

/**
 * Simple in-memory rate limiter
 * @param ip IP address to limit
 * @param limit Max requests per window
 * @param windowMs Window size in milliseconds
 * @returns Object indicating success and reset time (timestamp)
 */
export function checkRateLimit(ip: string, limit: number = 5, windowMs: number = 60 * 1000): { success: boolean; reset: number } {
  const now = Date.now();

  // Cleanup if map gets too big (e.g. > 10000 IPs) to prevent DoS via memory exhaustion
  if (trackers.size > 10000) {
      pruneTrackers();
  }

  const tracker = trackers.get(ip);

  if (!tracker || tracker.expiresAt < now) {
    const expiresAt = now + windowMs;
    trackers.set(ip, { count: 1, expiresAt });
    return { success: true, reset: expiresAt };
  }

  if (tracker.count >= limit) {
    return { success: false, reset: tracker.expiresAt };
  }

  tracker.count++;
  return { success: true, reset: tracker.expiresAt };
}
