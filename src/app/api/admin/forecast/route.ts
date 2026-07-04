import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { forecastQuestions, forecastPredictions, forecastLeaderboard } from "@/db/schema";
import { eq } from "drizzle-orm";

const ADMIN_IDS = ["user_3FjyZGikYeG9xNJm9uDh06WkLJh", "user_3FlZv0AydohOEdXeSRpOMucj6VD"];

async function checkAdmin() {
  const { userId } = await auth();
  return userId && ADMIN_IDS.includes(userId);
}

export async function POST(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const [question] = await db.insert(forecastQuestions).values({
    question: body.question,
    context: body.context,
    category: body.category,
    closesAt: new Date(body.closesAt),
    resolvesAt: new Date(body.resolvesAt),
    weekStart: body.weekStart,
    status: "pending",
  }).returning();
  return NextResponse.json({ question });
}

export async function PATCH(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, outcome, outcomeExplanation, approvePending } = await req.json();

  if (approvePending) {
    const [question] = await db.update(forecastQuestions)
      .set({ status: "open" })
      .where(eq(forecastQuestions.id, id))
      .returning();
    return NextResponse.json({ question });
  }

  // Resolve the question
  const [question] = await db.update(forecastQuestions)
    .set({ status: "resolved", outcome, outcomeExplanation })
    .where(eq(forecastQuestions.id, id))
    .returning();

  // Score all predictions for this question
  const predictions = await db.select().from(forecastPredictions).where(eq(forecastPredictions.questionId, id));

  for (const pred of predictions) {
    const correct = pred.prediction === outcome;
    const points = correct ? Math.round((pred.confidence / 100) * 100) : 0;

    await db.update(forecastPredictions)
      .set({ pointsEarned: points })
      .where(eq(forecastPredictions.id, pred.id));

    // Upsert leaderboard
    const existing = await db.select().from(forecastLeaderboard).where(eq(forecastLeaderboard.userId, pred.userId!));
    if (existing.length > 0) {
      await db.update(forecastLeaderboard)
        .set({
          totalPoints: existing[0].totalPoints + points,
          totalPredictions: existing[0].totalPredictions + 1,
          correctPredictions: existing[0].correctPredictions + (correct ? 1 : 0),
          updatedAt: new Date(),
        })
        .where(eq(forecastLeaderboard.userId, pred.userId!));
    } else {
      await db.insert(forecastLeaderboard).values({
        userId: pred.userId!,
        totalPoints: points,
        totalPredictions: 1,
        correctPredictions: correct ? 1 : 0,
      });
    }
  }

  return NextResponse.json({ question });
}

export async function DELETE(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  await db.delete(forecastQuestions).where(eq(forecastQuestions.id, id));
  return NextResponse.json({ ok: true });
}