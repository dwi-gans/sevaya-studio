import { NextRequest } from 'next/server';

interface AttemptRecord {
  failures: number;
  lastFailureAt: number;
  lockedUntil: number | null;
}

// In-memory brute force tracker store
const attemptStore = new Map<string, AttemptRecord>();

// Cleanup stale records periodically every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of attemptStore.entries()) {
      // Remove records that are unlocked and have had no failures in the last 1 hour
      if ((!record.lockedUntil || record.lockedUntil < now) && now - record.lastFailureAt > 60 * 60 * 1000) {
        attemptStore.delete(key);
      }
    }
  }, 10 * 60 * 1000);
}

export interface AntiBruteforceConfig {
  maxFailures?: number;        // Max failed attempts before lockout (default: 5)
  windowMs?: number;           // Time window to accumulate failures (default: 15 min)
  lockoutDurationMs?: number;  // Lockout duration after threshold reached (default: 15 min)
  progressiveDelay?: boolean;  // Add progressive delay to slow down automated attacks (default: true)
}

export interface BruteforceStatus {
  isLocked: boolean;
  remainingFailures: number;
  lockoutRemainingMs: number;
  lockoutMinutes: number;
}

/**
 * Extract client IP address safely from headers
 */
export function getClientIp(req: NextRequest | Request): string {
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();

  const vercelIp = req.headers.get('x-vercel-forwarded-for');
  if (vercelIp) return vercelIp.split(',')[0]?.trim() || 'unknown';

  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';

  return req.headers.get('x-real-ip') || 'unknown';
}

/**
 * Check if the given identifier (IP or username:IP) is currently locked out
 */
export function checkBruteforceLock(
  key: string,
  config: AntiBruteforceConfig = {}
): BruteforceStatus {
  const maxFailures = config.maxFailures ?? 5;
  const now = Date.now();
  const record = attemptStore.get(key);

  if (!record) {
    return {
      isLocked: false,
      remainingFailures: maxFailures,
      lockoutRemainingMs: 0,
      lockoutMinutes: 0,
    };
  }

  // Check active lockout
  if (record.lockedUntil && record.lockedUntil > now) {
    const remainingMs = record.lockedUntil - now;
    return {
      isLocked: true,
      remainingFailures: 0,
      lockoutRemainingMs: remainingMs,
      lockoutMinutes: Math.max(1, Math.ceil(remainingMs / 60000)),
    };
  }

  // If lockout expired, reset lockedUntil
  if (record.lockedUntil && record.lockedUntil <= now) {
    record.lockedUntil = null;
    record.failures = 0;
  }

  // Check window expiry
  const windowMs = config.windowMs ?? 15 * 60 * 1000;
  if (now - record.lastFailureAt > windowMs) {
    record.failures = 0;
  }

  const remaining = Math.max(0, maxFailures - record.failures);
  return {
    isLocked: false,
    remainingFailures: remaining,
    lockoutRemainingMs: 0,
    lockoutMinutes: 0,
  };
}

/**
 * Record a failed authentication attempt.
 * Locks out if the failure limit is reached.
 * Also introduces an artificial progressive delay to slow down automated scripts.
 */
export async function recordFailedAttempt(
  key: string,
  config: AntiBruteforceConfig = {}
): Promise<BruteforceStatus> {
  const maxFailures = config.maxFailures ?? 5;
  const windowMs = config.windowMs ?? 15 * 60 * 1000;
  const lockoutDurationMs = config.lockoutDurationMs ?? 15 * 60 * 1000;
  const now = Date.now();

  let record = attemptStore.get(key);
  if (!record) {
    record = { failures: 0, lastFailureAt: now, lockedUntil: null };
    attemptStore.set(key, record);
  }

  // Reset if window has elapsed
  if (now - record.lastFailureAt > windowMs) {
    record.failures = 0;
  }

  record.failures += 1;
  record.lastFailureAt = now;

  let isLocked = false;
  let remainingMs = 0;

  if (record.failures >= maxFailures) {
    record.lockedUntil = now + lockoutDurationMs;
    isLocked = true;
    remainingMs = lockoutDurationMs;
  }

  // Progressive delay / tarpit to slow down automated password guessing
  if (config.progressiveDelay !== false) {
    const delayMs = Math.min(1500, record.failures * 350);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  return {
    isLocked,
    remainingFailures: Math.max(0, maxFailures - record.failures),
    lockoutRemainingMs: remainingMs,
    lockoutMinutes: Math.max(1, Math.ceil(remainingMs / 60000)),
  };
}

/**
 * Clear failure records upon successful authentication
 */
export function resetFailedAttempts(key: string): void {
  attemptStore.delete(key);
}
