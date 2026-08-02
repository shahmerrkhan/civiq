import { timingSafeEqual } from "node:crypto";

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Verifies a request came from Vercel Cron (or an operator holding CRON_SECRET).
 *
 * Vercel Cron only ever sends `Authorization: Bearer $CRON_SECRET`. The
 * `x-cron-secret` header is accepted too so older manual callers keep working.
 * Comparison is constant-time, and a missing/empty CRON_SECRET always fails
 * closed rather than accepting an empty credential.
 */
export function isCronAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const bearer = req.headers.get("authorization");
  if (bearer && safeEqual(bearer, `Bearer ${secret}`)) return true;

  const header = req.headers.get("x-cron-secret");
  if (header && safeEqual(header, secret)) return true;

  return false;
}
