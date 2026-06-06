import Groq from "groq-sdk";
import { db } from "@/db";
import { forecastQuestions, forecastPredictions, forecastLeaderboard, pushSubscriptions } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import webpush from "web-push";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

// ─── Generate 3 new predictions for the week ─────────────────────────────────
export async function generateWeeklyForecasts(weekStart: string) {
  // Don't double-generate if we already have this week's forecasts
  const existing = await db
    .select()
    .from(forecastQuestions)
    .where(eq(forecastQuestions.weekStart, weekStart));

  if (existing.length >= 3) return existing;

  const now = new Date();
  const closesAt = new Date(now);
  closesAt.setDate(closesAt.getDate() + 5);

  const resolvesAt = new Date(now);
  resolvesAt.setDate(resolvesAt.getDate() + 14);

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 2000,
    messages: [{
      role: "user",
      content: `You are generating weekly political prediction questions for Civiq, a civic education platform for Ontario youth.

Today is ${weekStart}. Generate exactly 3 Yes/No prediction questions about Ontario politics that will be answerable within 2 weeks. These should be about real, specific things that are currently happening or likely to happen — bills, elections, political moves, government decisions, court rulings, policy announcements.

Return ONLY valid JSON, no markdown, no backticks:
{
  "questions": [
    {
      "question": "Will X happen by [specific date]? Max 20 words, clear Yes/No.",
      "context": "2-3 sentences of background. What is this about, why does it matter to young Ontarians.",
      "category": "Housing | Healthcare | Education | Environment | Economy | Politics | Courts"
    }
  ]
}

Rules:
- Questions must be binary — clearly resolvable as Yes or No
- Must be Ontario-specific or directly relevant to Ontario
- Must be about something that can realistically resolve in 2 weeks
- No vague questions like "Will Doug Ford remain popular?" — must be a specific event
- Vary the categories`,
    }],
  });

  const raw = completion.choices[0]?.message?.content ?? "";
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON in forecast generation response");

  const parsed = JSON.parse(match[0]);
  const questions = parsed.questions as { question: string; context: string; category: string }[];

  const inserted = await db.insert(forecastQuestions).values(
    questions.map(q => ({
      question: q.question,
      context: q.context,
      category: q.category,
      closesAt,
      resolvesAt,
      weekStart,
      status: "open",
    }))
  ).returning();

  return inserted;
}

// ─── Resolve expired questions via Groq ──────────────────────────────────────
export async function resolveExpiredForecasts() {
  const now = new Date();

  const expired = await db
    .select()
    .from(forecastQuestions)
    .where(
      and(
        eq(forecastQuestions.status, "closed"),
      )
    );

  const pastDeadline = expired.filter(q => new Date(q.resolvesAt) <= now);

  for (const question of pastDeadline) {
    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        max_tokens: 500,
        messages: [{
          role: "user",
          content: `You are resolving a political prediction question for Civiq.

Question: "${question.question}"
Context: "${question.context}"
This question was set on ${question.weekStart} and is now due for resolution.

Based on your knowledge of Canadian/Ontario politics and news, did this happen?

Return ONLY valid JSON, no markdown:
{
  "outcome": true or false,
  "explanation": "1-2 sentences explaining what actually happened and why the answer is Yes or No."
}

If you genuinely cannot determine the outcome, return {"outcome": null, "explanation": "Unable to verify outcome from available information."}`,
        }],
      });

      const raw = completion.choices[0]?.message?.content ?? "";
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) continue;

      const result = JSON.parse(match[0]);
      if (result.outcome === null) continue; // skip unresolvable

      // Update question
      await db.update(forecastQuestions)
        .set({
          status: "resolved",
          outcome: result.outcome,
          outcomeExplanation: result.explanation,
        })
        .where(eq(forecastQuestions.id, question.id));

      // Score all predictions for this question
      await scorePredictions(question.id, result.outcome);

    } catch (err) {
      console.error(`Failed to resolve forecast ${question.id}:`, err);
    }
  }
}

// ─── Close questions whose voting window has passed ──────────────────────────
export async function closeExpiredVoting() {
  const now = new Date();

  const open = await db
    .select()
    .from(forecastQuestions)
    .where(eq(forecastQuestions.status, "open"));

  for (const q of open) {
    if (new Date(q.closesAt) <= now) {
      await db.update(forecastQuestions)
        .set({ status: "closed" })
        .where(eq(forecastQuestions.id, q.id));
    }
  }
}

// ─── Score predictions + update leaderboard ──────────────────────────────────
async function scorePredictions(questionId: string, outcome: boolean) {
  const predictions = await db
    .select()
    .from(forecastPredictions)
    .where(
      and(
        eq(forecastPredictions.questionId, questionId),
        isNull(forecastPredictions.pointsEarned)
      )
    );

  for (const pred of predictions) {
    const correct = pred.prediction === outcome;
    // Points formula: correct = confidence value as points (50-100), wrong = 0
    const points = correct ? pred.confidence : 0;

    // Update prediction
    await db.update(forecastPredictions)
      .set({ pointsEarned: points })
      .where(eq(forecastPredictions.id, pred.id));

    // Upsert leaderboard
    const existing = await db
      .select()
      .from(forecastLeaderboard)
      .where(eq(forecastLeaderboard.userId, pred.userId!))
      .limit(1);

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

  // Push notify all users who predicted on this question
  await notifyResolution(questionId);
}

// ─── Push notifications on resolution ────────────────────────────────────────
async function notifyResolution(questionId: string) {
  try {
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;

    webpush.setVapidDetails(
      "mailto:civiq@civicclarityfoundation.org",
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    const question = await db
      .select()
      .from(forecastQuestions)
      .where(eq(forecastQuestions.id, questionId))
      .limit(1);

    if (!question[0]) return;

    const predictors = await db
      .select()
      .from(forecastPredictions)
      .where(eq(forecastPredictions.questionId, questionId));

    for (const pred of predictors) {
      const subs = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.userId, pred.userId!));

      const correct = pred.prediction === question[0].outcome;
      const msg = correct
        ? `✅ You got it right! +${pred.pointsEarned} points on "${question[0].question.substring(0, 40)}..."`
        : `❌ Not this time. Your prediction on "${question[0].question.substring(0, 40)}..." resolved.`;

      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify({ title: "Civic Forecast Result", body: msg, url: "/forecast" })
          );
        } catch {}
      }
    }
  } catch (err) {
    console.error("Forecast notification error:", err);
  }
}