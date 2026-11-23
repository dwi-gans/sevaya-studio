/**
 * rateLimit.ts
 * Sliding-window in-memory rate limiter.
 * Works in Next.js proxy (runs in Node.js runtime, NOT Edge).
 *
 * Usage:
 *   const result = rateLimit(ip, 'admin-auth', 5, 60_000);
 *   if (!result.ok) return Response.json({ error: 'Too many requests' }, { status: 429 });
 */

interface RateLimitEntry {
  hits: number;
  windowStart: number;
}

// Global in-memory store — survives across requests in same Node process
const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes to avoid memory leak
let lastCleanup = Date.now();
function maybeCleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < 5 * 60_000) return;
  lastCleanup = now;
  for (const [key, entry] of store.entries()) {
    if (now - entry.windowStart > windowMs * 2) {
      store.delete(key);
    }
  }
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterMs: number;
  headers: Record<string, string>;
}

/**
 * @param identifier  IP address or any unique key
 * @param bucket      Route group key e.g. 'admin-auth', 'payment', 'api-global'
 * @param limit       Max requests allowed in the window
 * @param windowMs    Window size in milliseconds
 */
export function rateLimit(
  identifier: string,
  bucket: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  maybeCleanup(windowMs);

  const key = `${bucket}:${identifier}`;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    // New window
    store.set(key, { hits: 1, windowStart: now });
    return {
      ok: true,
      remaining: limit - 1,
      retryAfterMs: 0,
      headers: {
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': String(limit - 1),
        'X-RateLimit-Reset': String(Math.ceil((now + windowMs) / 1000)),
      },
    };
  }

  entry.hits += 1;
  const remaining = Math.max(0, limit - entry.hits);
  const retryAfterMs = entry.windowStart + windowMs - now;

  if (entry.hits > limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterMs,
      headers: {
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil((entry.windowStart + windowMs) / 1000)),
        'Retry-After': String(Math.ceil(retryAfterMs / 1000)),
      },
    };
  }

  return {
    ok: true,
    remaining,
    retryAfterMs: 0,
    headers: {
      'X-RateLimit-Limit': String(limit),
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset': String(Math.ceil((entry.windowStart + windowMs) / 1000)),
    },
  };
}
