import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { forecastQuestions, forecastPredictions, forecastLeaderboard, users } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { generateWeeklyForecasts, closeExpiredVoting, resolveExpiredForecasts } from "@/lib/forecast";
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

    // Run maintenance inline — close expired voting, resolve expired questions
    await closeExpiredVoting();
    await resolveExpiredForecasts();

    const weekStart = getWeekStart();

    // Auto-generate this week's forecasts if missing
    await generateWeeklyForecasts(weekStart);

    const questions = await db
      .select()
      .from(forecastQuestions)
      .orderBy(desc(forecastQuestions.createdAt));

    // Enrich with vote counts + user's prediction if logged in
    const enriched = await Promise.all(
      questions.map(async (q) => {
        const allPredictions = await db
          .select()
          .from(forecastPredictions)
          .where(eq(forecastPredictions.questionId, q.id));

        const yesCount = allPredictions.filter(p => p.prediction === true).length;
        const noCount = allPredictions.filter(p => p.prediction === false).length;
        const total = allPredictions.length;

        const yesPct = total > 0 ? Math.round((yesCount / total) * 100) : 50;
        const noPct = 100 - yesPct;

        let myPrediction = null;
        if (userId) {
          const mine = await db
            .select()
            .from(forecastPredictions)
            .where(
              and(
                eq(forecastPredictions.userId, userId),
                eq(forecastPredictions.questionId, q.id)
              )
            )
            .limit(1);
          myPrediction = mine[0] ?? null;
        }

        return {
          ...q,
          yesCount,
          noCount,
          total,
          yesPct,
          noPct,
          myPrediction,
        };
      })
    );

    // Leaderboard — top 10
    const leaderboard = await db
      .select()
      .from(forecastLeaderboard)
      .orderBy(desc(forecastLeaderboard.totalPoints));

    const leaderboardWithNames = await Promise.all(
      leaderboard.slice(0, 10).map(async (entry) => {
        const user = await db
          .select()
          .from(users)
          .where(eq(users.id, entry.userId))
          .limit(1);
        return {
          ...entry,
          username: user[0]?.username ?? user[0]?.email?.split("@")[0] ?? "Anonymous",
        };
      })
    );

    return NextResponse.json({
      questions: enriched,
      leaderboard: leaderboardWithNames,
      weekStart,
    });
  } catch (err) {
    console.error("Forecast GET error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
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

    return NextResponse.json({ success: true, updated: false });
  } catch (err) {
    console.error("Forecast POST error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}