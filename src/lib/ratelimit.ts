import { sql } from "@/db";

export async function checkRateLimit(userId: string, action: string, maxPerHour: number): Promise<boolean> {
  const rows = await sql`
    SELECT COUNT(*) as cnt FROM user_activity
    WHERE user_id = ${userId}
      AND action = ${action}
      AND created_at > NOW() - INTERVAL '1 hour'
  `;
  return Number(rows[0]?.cnt ?? 0) < maxPerHour;
}