// Basic in-memory rate limiter
// Suitable for serverless environments with simple limits, though a distributed store like Redis is recommended for multi-instance scaling.

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// Clean up expired records every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Checks if a given identifier has exceeded the allowed request limit within a time window.
 * @param identifier Unique identifier for the rate limit (e.g., "ip:192.168.1.1")
 * @param limit Maximum number of allowed requests
 * @param windowMs Time window in milliseconds
 */
export function checkRateLimit(identifier: string, limit: number, windowMs: number) {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }
  
  if (record.count >= limit) {
    return { success: false, remaining: 0 };
  }
  
  record.count += 1;
  return { success: true, remaining: limit - record.count };
}