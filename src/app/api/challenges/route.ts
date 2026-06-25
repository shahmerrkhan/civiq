import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { civicChallenges, civicChallengeCompletions, civicChallengeStreaks } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";

function getThisMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().slice(0, 10);
}

const WEEKLY_CHALLENGES = [
  {
    title: "Read the other side",
    description: "Open a story and read the perspective opposite to your political leaning.",
    type: "read",
    xpReward: 50,
  },
  {
    title: "Learn something new",
    description: "Complete any module on an ideology or topic you haven't explored yet.",
    type: "learn",
    xpReward: 75,
  },
  {
    title: "Make your voice heard",
    description: "Vote on 3 different polls or region map issues this week.",
    type: "vote",
    xpReward: 50,
  },
];

export async function GET() {
  try {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const weekStart = getThisMonday();

  // Get or create this week's challenges
  let challenges = await db
    .select()
    .from(civicChallenges)
    .where(eq(civicChallenges.weekStart, weekStart));

  if (challenges.length === 0) {
    const inserted = await db
      .insert(civicChallenges)
      .values(WEEKLY_CHALLENGES.map(c => ({ ...c, weekStart })))
      .returning();
    challenges = inserted;
  }

  // Get user's completions for this week
  const completions = await db
    .select()
    .from(civicChallengeCompletions)
    .where(
      and(
        eq(civicChallengeCompletions.userId, userId),
        inArray(
          civicChallengeCompletions.challengeId,
          challenges.map(c => c.id)
        )
      )
    );

  const completedIds = new Set(completions.map(c => c.challengeId));

  // Get streak
  const streakRow = await db
    .select()
    .from(civicChallengeStreaks)
    .where(eq(civicChallengeStreaks.userId, userId))
    .limit(1);

  const streak = streakRow[0]?.currentStreak ?? 0;
  const allCompleted = challenges.every(c => completedIds.has(c.id));

  return NextResponse.json({
    weekStart,
    challenges: challenges.map(c => ({
      ...c,
      completed: completedIds.has(c.id),
    })),
    allCompleted,
    streak,
    completedCount: challenges.filter(c => completedIds.has(c.id)).length,
  });
  } catch (err) {
    console.error("Challenges GET error:", err);
    return NextResponse.json({ error: "Failed to load challenges" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const challengeId = body?.challengeId;
  if (!challengeId || typeof challengeId !== "string") {
    return NextResponse.json({ error: "Missing challengeId" }, { status: 400 });
  }

  // Check already completed
  const existing = await db
    .select()
    .from(civicChallengeCompletions)
    .where(
      and(
        eq(civicChallengeCompletions.userId, userId),
        eq(civicChallengeCompletions.challengeId, challengeId)
      )
    )
    .limit(1);

  if (existing[0]) return NextResponse.json({ error: "Already completed" }, { status: 409 });

  await db.insert(civicChallengeCompletions).values({ userId, challengeId });

  // Check if all 3 done this week
  const weekStart = getThisMonday();
  const allChallenges = await db
    .select()
    .from(civicChallenges)
    .where(eq(civicChallenges.weekStart, weekStart));

  const allCompletions = await db
    .select()
    .from(civicChallengeCompletions)
    .where(
      and(
        eq(civicChallengeCompletions.userId, userId),
        inArray(
          civicChallengeCompletions.challengeId,
          allChallenges.map(c => c.id)
        )
      )
    );

  const completedIds = new Set(allCompletions.map(c => c.challengeId));
  const allDone = allChallenges.every(c => completedIds.has(c.id));

  if (allDone) {
    // Update streak
    const streakRow = await db
      .select()
      .from(civicChallengeStreaks)
      .where(eq(civicChallengeStreaks.userId, userId))
      .limit(1);

    const lastWeek = new Date(weekStart);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastWeekStr = lastWeek.toISOString().slice(0, 10);

    const newStreak = streakRow[0]?.lastCompletedWeek === lastWeekStr
      ? (streakRow[0].currentStreak ?? 0) + 1
      : 1;

    await db
      .insert(civicChallengeStreaks)
      .values({ userId, currentStreak: newStreak, lastCompletedWeek: weekStart })
      .onConflictDoUpdate({
        target: civicChallengeStreaks.userId,
        set: { currentStreak: newStreak, lastCompletedWeek: weekStart, updatedAt: new Date() },
      });
  }

  const challenge = allChallenges.find(c => c.id === challengeId);
  return NextResponse.json({ success: true, xpAwarded: challenge?.xpReward ?? 50, allDone });
  } catch (err) {
    console.error("Challenges POST error:", err);
    return NextResponse.json({ error: "Failed to complete challenge" }, { status: 500 });
  }
}