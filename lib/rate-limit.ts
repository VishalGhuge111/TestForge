// In-memory rate limiter
const requestCounts = new Map<string, { count: number; resetTime: number }>();

const REQUESTS_PER_MINUTE = 10;
const WINDOW_MS = 60 * 1000; // 1 minute

export function checkRateLimit(userId: string = 'anonymous'): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  const key = userId;

  let record = requestCounts.get(key);

  if (!record || record.resetTime <= now) {
    // Reset the counter
    record = {
      count: 1,
      resetTime: now + WINDOW_MS,
    };
    requestCounts.set(key, record);
    return {
      allowed: true,
      remaining: REQUESTS_PER_MINUTE - 1,
      resetTime: record.resetTime,
    };
  }

  if (record.count >= REQUESTS_PER_MINUTE) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }

  record.count++;
  return {
    allowed: true,
    remaining: REQUESTS_PER_MINUTE - record.count,
    resetTime: record.resetTime,
  };
}

export function getRateLimitInfo(userId: string = 'anonymous') {
  const record = requestCounts.get(userId);
  if (!record) {
    return {
      remaining: REQUESTS_PER_MINUTE,
      resetTime: Date.now() + WINDOW_MS,
      limit: REQUESTS_PER_MINUTE,
    };
  }

  const now = Date.now();
  if (record.resetTime <= now) {
    return {
      remaining: REQUESTS_PER_MINUTE,
      resetTime: now + WINDOW_MS,
      limit: REQUESTS_PER_MINUTE,
    };
  }

  return {
    remaining: Math.max(0, REQUESTS_PER_MINUTE - record.count),
    resetTime: record.resetTime,
    limit: REQUESTS_PER_MINUTE,
  };
}
