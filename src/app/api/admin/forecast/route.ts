import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { forecastQuestions, forecastPredictions, forecastLeaderboard } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { isAdmin } from "@/lib/admin";
import {
  AdminForecastCreateSchema,
  AdminForecastPatchSchema,
  AdminIdSchema,
} from "@/lib/schemas";

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = AdminForecastCreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const [question] = await db.insert(forecastQuestions).values({
    question: parsed.data.question,
    context: parsed.data.context,
    category: parsed.data.category,
    closesAt: parsed.data.closesAt,
    resolvesAt: parsed.data.resolvesAt,
    weekStart: parsed.data.weekStart,
    status: "pending",
  }).returning();
  return NextResponse.json({ question });
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = AdminForecastPatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  const { id, outcome, outcomeExplanation, approvePending } = parsed.data;

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

  if (typeof outcome !== "boolean") {
    return NextResponse.json({ error: "outcome is required to resolve" }, { status: 400 });
  }

  // Score only predictions that have not been scored yet, so re-resolving a
  // question does not double-credit the leaderboard.
  const predictions = await db.select().from(forecastPredictions).where(
    and(eq(forecastPredictions.questionId, id), isNull(forecastPredictions.pointsEarned))
  );

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
  if (!(await isAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = AdminIdSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  const { id } = parsed.data;

  // Predictions FK-reference the question; remove them first.
  await db.delete(forecastPredictions).where(eq(forecastPredictions.questionId, id));
  await db.delete(forecastQuestions).where(eq(forecastQuestions.id, id));
  return NextResponse.json({ ok: true });
}