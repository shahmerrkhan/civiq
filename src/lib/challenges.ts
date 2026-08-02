import { db } from "@/db";
import {
  userActivity, userProgress, pollVotes, regionVotes,
} from "@/db/schema";
import { and, eq, gte, sql } from "drizzle-orm";

/** Monday 00:00 UTC of the current week, matching getThisMonday()'s date string. */
export function getWeekStartDate(): Date {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + diff
  ));
  return monday;
}

export function getThisMonday(): string {
  return getWeekStartDate().toISOString().slice(0, 10);
}

export type ChallengeVerification = {
  satisfied: boolean;
  progress: number;
  required: number;
  reason: string;
};

/**
 * Confirms the work behind a weekly challenge actually happened this week.
 *
 * The client used to simply assert completion and be handed the XP; every check
 * below is derived from rows the user can only create by performing the real
 * action through its own validated endpoint.
 */
export async function verifyChallenge(
  userId: string,
  type: string,
  weekStart: Date
): Promise<ChallengeVerification> {
  switch (type) {
    // "Read the other side" — opened a perspective that opposes their compass.
    case "read": {
      const rows = await db
        .select({ id: userActivity.id })
        .from(userActivity)
        .where(and(
          eq(userActivity.userId, userId),
          eq(userActivity.action, "perspective_view"),
          sql`${userActivity.meta}->>'opposing' = 'true'`,
          gte(userActivity.createdAt, weekStart)
        ))
        .limit(1);

      return {
        satisfied: rows.length > 0,
        progress: rows.length,
        required: 1,
        reason: "Open a story and read the perspective opposite your leaning.",
      };
    }

    // "Learn something new" — finished a learn module this week.
    case "learn": {
      const rows = await db
        .select({ id: userProgress.id })
        .from(userProgress)
        .where(and(
          eq(userProgress.userId, userId),
          eq(userProgress.completed, true),
          gte(userProgress.completedAt, weekStart)
        ))
        .limit(1);

      return {
        satisfied: rows.length > 0,
        progress: rows.length,
        required: 1,
        reason: "Complete a learn module you haven't finished before.",
      };
    }

    // "Make your voice heard" — 3 poll votes and/or region map votes this week.
    case "vote": {
      const [pollRows, regionRows] = await Promise.all([
        db.select({ count: sql<number>`cast(count(distinct ${pollVotes.pollId}) as int)` })
          .from(pollVotes)
          .where(and(eq(pollVotes.userId, userId), gte(pollVotes.createdAt, weekStart))),
        db.select({ count: sql<number>`cast(count(distinct ${regionVotes.issueId}) as int)` })
          .from(regionVotes)
          .where(and(eq(regionVotes.userId, userId), gte(regionVotes.createdAt, weekStart))),
      ]);

      const total = (pollRows[0]?.count ?? 0) + (regionRows[0]?.count ?? 0);
      return {
        satisfied: total >= 3,
        progress: total,
        required: 3,
        reason: "Vote on 3 different polls or region map issues this week.",
      };
    }

    // "opinion" is defined in the schema but not currently seeded; support it
    // rather than silently auto-approving an unknown type.
    case "opinion": {
      const rows = await db
        .select({ id: userActivity.id })
        .from(userActivity)
        .where(and(
          eq(userActivity.userId, userId),
          eq(userActivity.action, "opinion"),
          gte(userActivity.createdAt, weekStart)
        ))
        .limit(1);

      return {
        satisfied: rows.length > 0,
        progress: rows.length,
        required: 1,
        reason: "Write your opinion on a story this week.",
      };
    }

    // Unknown types fail closed.
    default:
      return {
        satisfied: false,
        progress: 0,
        required: 1,
        reason: "This challenge can't be verified automatically.",
      };
  }
}
