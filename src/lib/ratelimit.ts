import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const limiters = new Map<string, Ratelimit>();

function getLimiter(action: string, maxPerHour: number): Ratelimit {
  const key = `${action}:${maxPerHour}`;
  if (!limiters.has(key)) {
    limiters.set(
      key,
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(maxPerHour, "1 h"),
        prefix: `civiq:rl:${action}`,
      })
    );
  }
  return limiters.get(key)!;
}

export async function checkRateLimit(userId: string, action: string, maxPerHour: number): Promise<boolean> {
  const limiter = getLimiter(action, maxPerHour);
  const { success } = await limiter.limit(userId);
  return success;
}