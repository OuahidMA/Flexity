/**
 * In-memory fixed-window rate limiting.
 *
 * Each limiter name/key gets a bucket holding a request count and a reset
 * timestamp. Buckets are process-local: they are not shared across instances
 * and reset on restart, which is acceptable for single-process deployments but
 * would need a shared store (e.g. Redis) when scaling horizontally.
 *
 * To keep memory bounded, expired buckets are swept once a minute and the map
 * evicts its oldest insertion when it reaches MAX_BUCKETS.
 */

const buckets = new Map();
const MAX_BUCKETS = 50_000;

// Periodic sweep removes windows that have already reset. `unref` keeps this
// timer from holding the Node process open during shutdown/tests.
const cleanupTimer = setInterval(() => {
  const now = Date.now();

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}, 60 * 1000);

if (typeof cleanupTimer.unref === "function") {
  cleanupTimer.unref();
}

/**
 * Builds an Express rate-limit middleware for one policy.
 *
 * Counters are incremented before the limit check, so the request that exceeds
 * `max` is rejected. Response headers expose the policy to clients, and 429
 * responses include Retry-After in seconds.
 *
 * @param {object} options
 * @param {number} options.windowMs Fixed window duration in milliseconds.
 * @param {number} options.max Allowed requests per key per window.
 * @param {(req: import("express").Request) => string|null} [options.keyGenerator]
 *   Derives the bucket key; returning falsy skips limiting for that request.
 *   Defaults to req.ip.
 * @param {string} [options.message] Client-facing 429 message.
 * @param {string} [options.code] Machine-readable 429 code.
 * @returns {import("express").RequestHandler}
 */
export function createRateLimiter({
  windowMs,
  max,
  keyGenerator,
  message = "Too many requests. Please try again later.",
  code = "RATE_LIMITED",
}) {
  return function rateLimit(req, res, next) {
    const key = keyGenerator ? keyGenerator(req) : req.ip;

    if (!key) return next();

    const now = Date.now();
    let bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      if (buckets.size >= MAX_BUCKETS) {
        const oldestKey = buckets.keys().next().value;

        if (oldestKey !== undefined) buckets.delete(oldestKey);
      }

      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;

    const remaining = Math.max(0, max - bucket.count);
    const resetSeconds = Math.ceil(bucket.resetAt / 1000);

    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader("X-RateLimit-Remaining", String(remaining));
    res.setHeader("X-RateLimit-Reset", String(resetSeconds));

    if (bucket.count > max) {
      const retryAfter = Math.max(
        1,
        Math.ceil((bucket.resetAt - now) / 1000)
      );

      res.setHeader("Retry-After", String(retryAfter));

      return res.status(429).json({
        success: false,
        code,
        message,
        retryAfter,
      });
    }

    return next();
  };
}

/**
 * Stable identifier used for IP-based limits. Falls back to the socket address
 * because req.ip can be undefined in unusual proxy/transport setups.
 *
 * @param {import("express").Request} req
 * @returns {string}
 */
export function clientIp(req) {
  return req.ip || req.socket?.remoteAddress || "unknown";
}

export default createRateLimiter;
