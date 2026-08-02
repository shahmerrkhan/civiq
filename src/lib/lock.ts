import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * Runs `fn` only if this process wins a short-lived Redis lock, otherwise
 * returns `fallback` immediately.
 *
 * Used around Gemini content generation that is triggered lazily by page loads:
 * without it, every concurrent request on the first hit of a new week fires its
 * own grounded generation and inserts duplicate rows.
 */
export async function withLock<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  let acquired = false;
  try {
    acquired = (await redis.set(key, "1", { nx: true, ex: ttlSeconds })) !== null;
  } catch {
    // Redis unavailable — proceed rather than blocking content generation.
    acquired = true;
  }

  if (!acquired) return fallback;

  try {
    return await fn();
  } finally {
    await redis.del(key).catch(() => {});
  }
}
