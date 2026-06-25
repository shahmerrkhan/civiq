import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { sql: rawSql } = await import("@/db");

    // Top 20 in one query
    const topRows = await rawSql`
      SELECT
        u.id,
        u.username,
        u.streak_count,
        COALESCE(p.cnt, 0) * 10 +
        COALESCE(v.cnt, 0) * 5 +
        COALESCE(d.cnt, 0) * 15 +
        COALESCE(o.cnt, 0) * 3 AS civic_score
      FROM users u
      LEFT JOIN (SELECT user_id, COUNT(*) AS cnt FROM user_progress GROUP BY user_id) p ON p.user_id = u.id
      LEFT JOIN (SELECT user_id, COUNT(*) AS cnt FROM poll_votes GROUP BY user_id) v ON v.user_id = u.id
      LEFT JOIN (SELECT user_id, COUNT(*) AS cnt FROM daily_answers GROUP BY user_id) d ON d.user_id = u.id
      LEFT JOIN (SELECT user_id, COUNT(*) AS cnt FROM user_opinions GROUP BY user_id) o ON o.user_id = u.id
      WHERE u.onboarding_complete = true
      ORDER BY civic_score DESC
      LIMIT 20
    `;

    // Separate query just for current user's rank
    const rankRow = await rawSql`
      SELECT rank FROM (
        SELECT
          u.id,
          RANK() OVER (ORDER BY (
            COALESCE(p.cnt, 0) * 10 +
            COALESCE(v.cnt, 0) * 5 +
            COALESCE(d.cnt, 0) * 15 +
            COALESCE(o.cnt, 0) * 3
          ) DESC) AS rank
        FROM users u
        LEFT JOIN (SELECT user_id, COUNT(*) AS cnt FROM user_progress GROUP BY user_id) p ON p.user_id = u.id
        LEFT JOIN (SELECT user_id, COUNT(*) AS cnt FROM poll_votes GROUP BY user_id) v ON v.user_id = u.id
        LEFT JOIN (SELECT user_id, COUNT(*) AS cnt FROM daily_answers GROUP BY user_id) d ON d.user_id = u.id
        LEFT JOIN (SELECT user_id, COUNT(*) AS cnt FROM user_opinions GROUP BY user_id) o ON o.user_id = u.id
        WHERE u.onboarding_complete = true
      ) ranked
      WHERE id = ${userId}
    `;

    const leaderboard = topRows.map((r: any) => ({
      userId: r.id,
      username: r.username || "Anonymous",
      streakCount: r.streak_count ?? 0,
      civicScore: Number(r.civic_score),
      isCurrentUser: r.id === userId,
    }));

    return NextResponse.json({
      leaderboard,
      currentUserRank: Number(rankRow[0]?.rank ?? 0),
      total: leaderboard.length,
    });
  } catch (err) {
    console.error("Leaderboard error:", err);
    return NextResponse.json({ error: "Failed to load leaderboard" }, { status: 500 });
  }
}