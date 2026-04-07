interface RateLimitOptions {
  windowMs: number; // time window in ms
  max: number;      // max requests per window
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export function rateLimit(options: RateLimitOptions) {
  const store = new Map<string, RateLimitEntry>();

  // Periodically clean expired entries to prevent memory leaks
  const cleanup = setInterval(() => {
    const now = Date.now();
    store.forEach((entry, key) => {
      if (entry.resetAt <= now) {
        store.delete(key);
      }
    });
  }, options.windowMs * 2);

  // Allow cleanup to be garbage-collected in serverless environments
  if (cleanup.unref) cleanup.unref();

  return function check(identifier: string): {
    success: boolean;
    remaining: number;
    reset: Date;
  } {
    const now = Date.now();
    const entry = store.get(identifier);

    if (!entry || entry.resetAt <= now) {
      // Start new window
      store.set(identifier, { count: 1, resetAt: now + options.windowMs });
      return { success: true, remaining: options.max - 1, reset: new Date(now + options.windowMs) };
    }

    if (entry.count >= options.max) {
      return { success: false, remaining: 0, reset: new Date(entry.resetAt) };
    }

    entry.count++;
    return { success: true, remaining: options.max - entry.count, reset: new Date(entry.resetAt) };
  };
}

// Pre-built limiters for common use cases
export const uploadLimiter = rateLimit({ windowMs: 60_000, max: 10 });
export const deployLimiter = rateLimit({ windowMs: 60_000, max: 10 });
export const aiChatLimiter = rateLimit({ windowMs: 60_000, max: 30 });
