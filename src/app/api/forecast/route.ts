import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { forecastQuestions, forecastPredictions, forecastLeaderboard, users, userActivity } from "@/db/schema";
import { eq, desc, and, inArray, sql } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { generateWeeklyForecasts } from "@/lib/forecast";
import { ForecastPredictSchema } from "@/lib/schemas";

function getWeekStart() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust to Monday
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split("T")[0];
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    const weekStart = getWeekStart();
    await generateWeeklyForecasts(weekStart);

    const questions = await db
      .select()
      .from(forecastQuestions)
      .orderBy(desc(forecastQuestions.createdAt));

    // Enrich with vote counts + user's prediction if logged in
    
    const questionIds = questions.map(q => q.id);

    const [allPredictions, myPredictions] = await Promise.all([
      questionIds.length > 0
        ? db.select().from(forecastPredictions).where(inArray(forecastPredictions.questionId, questionIds))
        : Promise.resolve([]),
      userId && questionIds.length > 0
        ? db.select().from(forecastPredictions).where(and(eq(forecastPredictions.userId, userId), inArray(forecastPredictions.questionId, questionIds)))
        : Promise.resolve([]),
    ]);

    const predMap: Record<string, (typeof allPredictions)[0][]> = {};
    for (const p of allPredictions) {
      if (!p.questionId) continue;
      if (!predMap[p.questionId]) predMap[p.questionId] = [];
      predMap[p.questionId].push(p);
    }
    const myPredMap: Record<string, typeof myPredictions[0]> = {};
    for (const p of myPredictions) if (p.questionId) myPredMap[p.questionId] = p;

    const enriched = questions.map((q) => {
      const preds = predMap[q.id] ?? [];
      const yesCount = preds.filter(p => p.prediction === true).length;
      const noCount = preds.filter(p => p.prediction === false).length;
      const total = preds.length;
      const yesPct = total > 0 ? Math.round((yesCount / total) * 100) : 50;
      return {
        ...q,
        yesCount,
        noCount,
        total,
        yesPct,
        noPct: 100 - yesPct,
        myPrediction: myPredMap[q.id] ?? null,
      };
    });

    // Leaderboard — top 10
    const leaderboard = await db
      .select()
      .from(forecastLeaderboard)
      .orderBy(desc(forecastLeaderboard.totalPoints));

    const topEntries = leaderboard.slice(0, 10);
    const leaderboardUserIds = topEntries.map(e => e.userId).filter(Boolean);
    const leaderboardUsers = leaderboardUserIds.length > 0
      ? await db.select().from(users).where(inArray(users.id, leaderboardUserIds))
      : [];
    const userMap = Object.fromEntries(leaderboardUsers.map(u => [u.id, u]));

    const leaderboardWithNames = topEntries.map(entry => ({
      ...entry,
      username: userMap[entry.userId]?.username
        ?? userMap[entry.userId]?.email?.split("@")[0]
        ?? "Anonymous",
    }));

    return NextResponse.json({
      questions: enriched,
      leaderboard: leaderboardWithNames,
      weekStart,
    });
  } catch (err) {
    console.error("Forecast GET error:", err);
    return NextResponse.json({ error: "Failed to load forecasts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    const parsed = ForecastPredictSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
    }

    const { questionId, prediction, confidence } = parsed.data;

    // Check question exists and is still open
    const question = await db
      .select()
      .from(forecastQuestions)
      .where(eq(forecastQuestions.id, questionId))
      .limit(1);

    if (!question[0]) return NextResponse.json({ error: "Question not found" }, { status: 404 });
    if (question[0].status !== "open") return NextResponse.json({ error: "Voting is closed for this question" }, { status: 400 });

    // Check for existing prediction — one per user per question
    const existing = await db
      .select()
      .from(forecastPredictions)
      .where(
        and(
          eq(forecastPredictions.userId, userId),
          eq(forecastPredictions.questionId, questionId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing prediction
      await db.update(forecastPredictions)
        .set({ prediction, confidence })
        .where(eq(forecastPredictions.id, existing[0].id));
      return NextResponse.json({ success: true, updated: true });
    }

    await db.insert(forecastPredictions).values({
      userId,
      questionId,
      prediction,
      confidence,
    });
    await db.insert(userActivity).values({ userId, action: "forecast_predict", meta: { questionId, xp: 25 } });

    // Update streak atomically
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    await db.execute(sql`
      UPDATE users SET
        streak_count = CASE
          WHEN last_streak_date = ${today} THEN COALESCE(streak_count, 1)
          WHEN last_streak_date = ${yesterday} THEN COALESCE(streak_count, 0) + 1
          ELSE 1
        END,
        last_streak_date = ${today}
      WHERE id = ${userId}
    `);

    return NextResponse.json({ success: true, updated: false });
  } catch (err) {
    console.error("Forecast POST error:", err);
    return NextResponse.json({ error: "Failed to submit prediction" }, { status: 500 });
  }
}