import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, pollVotes, userProgress, userOpinions, dailyAnswers } from "@/db/schema";
import { eq, count, desc } from "drizzle-orm";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const allUsers = await db.select().from(users).where(eq(users.onboardingComplete, true));

    const scores = await Promise.all(
      allUsers.map(async (u) => {
        const [votes, progress, opinions, correct] = await Promise.all([
          db.select({ count: count() }).from(pollVotes).where(eq(pollVotes.userId, u.id)),
          db.select({ count: count() }).from(userProgress).where(eq(userProgress.userId, u.id)),
          db.select({ count: count() }).from(userOpinions).where(eq(userOpinions.userId, u.id)),
          db.select({ count: count() }).from(dailyAnswers).where(eq(dailyAnswers.userId, u.id)),
        ]);
        const civicScore =
          (progress[0]?.count ?? 0) * 10 +
          (votes[0]?.count ?? 0) * 5 +
          (correct[0]?.count ?? 0) * 15 +
          (opinions[0]?.count ?? 0) * 3;

        return {
          userId: u.id,
          username: u.username || "Anonymous",
          streakCount: u.streakCount ?? 0,
          civicScore,
          isCurrentUser: u.id === userId,
        };
      })
    );

    const sorted = scores.sort((a, b) => b.civicScore - a.civicScore).slice(0, 20);
    const currentUserRank = scores.findIndex(s => s.isCurrentUser) + 1;

    return NextResponse.json({ leaderboard: sorted, currentUserRank, total: scores.length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}