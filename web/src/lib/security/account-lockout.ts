/**
 * Account lockout mechanism for failed login attempts
 */

interface LockoutRecord {
  attempts: number;
  lockedUntil: number | null;
  lastAttempt: number;
}

const lockoutStore: Map<string, LockoutRecord> = new Map();

// Configuration
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour

// Clean up old records periodically
setInterval(() => {
  const now = Date.now();
  lockoutStore.forEach((record, key) => {
    if (record.lockedUntil && record.lockedUntil < now) {
      lockoutStore.delete(key);
    }
  });
}, CLEANUP_INTERVAL);

/**
 * Check if account is locked
 */
export function isAccountLocked(identifier: string): {
  locked: boolean;
  lockedUntil?: number;
} {
  const record = lockoutStore.get(identifier);
  if (!record) {
    return { locked: false };
  }

  const now = Date.now();
  if (record.lockedUntil && record.lockedUntil > now) {
    return {
      locked: true,
      lockedUntil: record.lockedUntil,
    };
  }

  // Lockout expired, clear it
  if (record.lockedUntil && record.lockedUntil <= now) {
    lockoutStore.delete(identifier);
    return { locked: false };
  }

  return { locked: false };
}

/**
 * Record a failed login attempt
 */
export function recordFailedAttempt(identifier: string): {
  locked: boolean;
  attemptsRemaining: number;
  lockedUntil?: number;
} {
  const record = lockoutStore.get(identifier) || {
    attempts: 0,
    lockedUntil: null,
    lastAttempt: 0,
  };

  record.attempts++;
  record.lastAttempt = Date.now();

  if (record.attempts >= MAX_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOCKOUT_DURATION;
    lockoutStore.set(identifier, record);
    return {
      locked: true,
      attemptsRemaining: 0,
      lockedUntil: record.lockedUntil,
    };
  }

  lockoutStore.set(identifier, record);
  return {
    locked: false,
    attemptsRemaining: MAX_ATTEMPTS - record.attempts,
  };
}

/**
 * Clear failed attempts (on successful login)
 */
export function clearFailedAttempts(identifier: string): void {
  lockoutStore.delete(identifier);
}

/**
 * Get remaining attempts
 */
export function getRemainingAttempts(identifier: string): number {
  const record = lockoutStore.get(identifier);
  if (!record) {
    return MAX_ATTEMPTS;
  }

  if (record.lockedUntil && record.lockedUntil > Date.now()) {
    return 0;
  }

  return MAX_ATTEMPTS - record.attempts;
}

