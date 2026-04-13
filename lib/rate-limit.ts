interface Entry {
  count: number;
  windowStart: number;
}

// Module-level store — one Map per serverless function instance.
// Each Vercel instance tracks its own window; this is sufficient as an abuse deterrent.
const store = new Map<string, Entry>();

/**
 * Tumbling-window in-memory rate limiter.
 * @param key     - Unique identifier (e.g. "chat:userId", "webhook:secret")
 * @param limit   - Max requests allowed per window
 * @param windowMs - Window duration in milliseconds
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: true } | { allowed: false; retryAfter: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.windowStart >= windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (entry.count >= limit) {
    const retryAfter = Math.ceil((entry.windowStart + windowMs - now) / 1000);
    return { allowed: false, retryAfter };
  }

  entry.count += 1;
  return { allowed: true };
}
