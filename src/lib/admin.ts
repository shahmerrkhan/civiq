import { auth, clerkClient } from "@clerk/nextjs/server";
import { Redis } from "@upstash/redis";

// Fallback list, used only when ADMIN_USER_IDS is not configured.
const FALLBACK_ADMIN_IDS = [
  "user_3FjyZGikYeG9xNJm9uDh06WkLJh",
  "user_3FlZv0AydohOEdXeSRpOMucj6VD",
];

const ADMIN_EMAILS = ["m.shahmeer.khan8@gmail.com", "rehan.mazid@gmail.com"];

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

function adminIds(): string[] {
  const fromEnv = process.env.ADMIN_USER_IDS
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return fromEnv?.length ? fromEnv : FALLBACK_ADMIN_IDS;
}

export function isAdminId(userId: string | null | undefined): boolean {
  return !!userId && adminIds().includes(userId);
}

/**
 * Resolves the current admin user, or null. Checks the id allowlist first
 * (free), then falls back to the email allowlist via Clerk (cached in Redis
 * for 5 minutes) so an admin whose id is not listed still gets through.
 */
export async function getAdminUserId(): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) return null;
  if (isAdminId(userId)) return userId;

  const cacheKey = `civiq:admin:${userId}`;
  const cached = await redis.get<boolean>(cacheKey).catch(() => null);
  if (cached !== null && cached !== undefined) return cached ? userId : null;

  let isAdmin = false;
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    isAdmin = user.emailAddresses.some((e) =>
      ADMIN_EMAILS.includes(e.emailAddress.toLowerCase())
    );
  } catch {
    return null;
  }

  await redis.set(cacheKey, isAdmin, { ex: 300 }).catch(() => {});
  return isAdmin ? userId : null;
}

export async function isAdmin(): Promise<boolean> {
  return (await getAdminUserId()) !== null;
}
