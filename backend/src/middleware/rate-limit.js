import { ApiError } from "../utils/api-error.js";

function defaultKeyGenerator(req) {
  const forwardedFor = req.headers["x-forwarded-for"];
  const ip =
    (typeof forwardedFor === "string" ? forwardedFor.split(",")[0].trim() : null) ||
    req.ip ||
    req.socket?.remoteAddress ||
    "unknown";

  const userKey = req.auth?.firebaseUid || req.auth?.dbUser?.firebase_uid || "";
  return `${ip}:${userKey}`;
}

export function createRateLimiter(options = {}) {
  const windowMs = Number(options.windowMs || 15 * 60 * 1000);
  const max = Number(options.max || 100);
  const keyGenerator = options.keyGenerator || defaultKeyGenerator;
  const message = options.message || "Too many requests. Please try again later.";
  const store = new Map();

  return function rateLimitMiddleware(req, res, next) {
    const now = Date.now();
    const key = `${options.name || "default"}:${keyGenerator(req)}`;
    const current = store.get(key);

    if (!current || current.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      res.setHeader("RateLimit-Limit", max);
      res.setHeader("RateLimit-Remaining", max - 1);
      res.setHeader("RateLimit-Reset", Math.ceil((now + windowMs) / 1000));
      return next();
    }

    if (current.count >= max) {
      res.setHeader("Retry-After", Math.ceil((current.resetAt - now) / 1000));
      return next(new ApiError(429, message));
    }

    current.count += 1;
    store.set(key, current);

    res.setHeader("RateLimit-Limit", max);
    res.setHeader("RateLimit-Remaining", Math.max(max - current.count, 0));
    res.setHeader("RateLimit-Reset", Math.ceil(current.resetAt / 1000));

    if (store.size > 2000) {
      for (const [storedKey, entry] of store.entries()) {
        if (entry.resetAt <= now) {
          store.delete(storedKey);
        }
      }
    }

    return next();
  };
}
