import Groq from "groq-sdk";
import { db } from "@/db";
import { witnessEvents, witnessWatches, pushSubscriptions } from "@/db/schema";
import { eq, and, lte } from "drizzle-orm";
import webpush from "web-push";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(diff);
  return monday.toISOString().split("T")[0];
}

export async function generateWeeklyWitnessEvents(weekStart: string) {
  const existing = await db
    .select()
    .from(witnessEvents)
    .where(eq(witnessEvents.weekStart, weekStart));

  if (existing.length >= 5) return existing;

  const now = new Date();

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 2500,
    messages: [{
      role: "user",
      content: `You are generating "Witness Events" for Civiq, a civic education platform for Ontario youth. These are real upcoming Ontario political decisions, court dates, bill readings, elections, budget votes, or policy announcements that have a known or approximate deadline within the next 30 days.

Today is ${now.toISOString().split("T")[0]}. Generate exactly 5 events.

Return ONLY valid JSON, no markdown, no backticks:
{
  "events": [
    {
      "title": "Short punchy title, max 10 words. E.g. 'Bill 212 Third Reading Vote'",
      "description": "2-3 sentences. What is this, why does it matter to young Ontarians, what happens if it passes or fails.",
      "category": "Bills | Courts | Elections | Budget | Policy | Municipal",
      "deadlineDays": 7,
      "sourceUrl": "https://www.ola.org or relevant real URL"
    }
  ]
}

Rules:
- deadlineDays must be between 1 and 30
- Every event must be Ontario-specific
- Must be a real type of political event (bill reading, court ruling, election, budget vote, policy deadline)
- Vary the categories
- Make them genuinely interesting to a 16-25 year old`,
    }],
  });

  const raw = completion.choices[0]?.message?.content ?? "";
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON in witness generation");

  const parsed = JSON.parse(match[0]);
  const events = parsed.events as {
    title: string;
    description: string;
    category: string;
    deadlineDays: number;
    sourceUrl: string;
  }[];

  const inserted = await db.insert(witnessEvents).values(
    events.map(e => {
      const deadlineAt = new Date();
      deadlineAt.setDate(deadlineAt.getDate() + Math.max(1, Math.min(30, e.deadlineDays)));
      return {
        title: e.title,
        description: e.description,
        category: e.category,
        deadlineAt,
        sourceUrl: e.sourceUrl,
        weekStart,
        status: "upcoming",
      };
    })
  ).returning();

  return inserted;
}

export async function resolveExpiredWitnessEvents() {
  const now = new Date();

  const expired = await db
    .select()
    .from(witnessEvents)
    .where(
      and(
        eq(witnessEvents.status, "upcoming"),
        lte(witnessEvents.deadlineAt, now)
      )
    );

  for (const event of expired) {
    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        max_tokens: 400,
        messages: [{
          role: "user",
          content: `You are resolving a political event for Civiq.

Event: "${event.title}"
Description: "${event.description}"
Deadline was: ${event.deadlineAt.toISOString().split("T")[0]}

Based on your knowledge of Ontario/Canadian politics, what actually happened? Did it occur as expected, get delayed, pass, fail, or something else?

Return ONLY valid JSON, no markdown:
{
  "outcome": "passed" | "failed" | "delayed" | "cancelled" | "occurred" | "unknown",
  "explanation": "1-2 sentences on what actually happened."
}`,
        }],
      });

      const raw = completion.choices[0]?.message?.content ?? "";
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) continue;

      const result = JSON.parse(match[0]);

      await db.update(witnessEvents)
        .set({
          status: "resolved",
          outcome: result.outcome,
          outcomeExplanation: result.explanation,
          updatedAt: new Date(),
        })
        .where(eq(witnessEvents.id, event.id));

      await notifyWatchers(event.id, event.title, result.outcome, result.explanation);

    } catch (err) {
      console.error(`Failed to resolve witness event ${event.id}:`, err);
    }
  }
}

async function notifyWatchers(eventId: string, title: string, outcome: string, explanation: string) {
  try {
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;

    webpush.setVapidDetails(
      "mailto:civiq@civicclarityfoundation.org",
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    const watchers = await db
      .select()
      .from(witnessWatches)
      .where(eq(witnessWatches.eventId, eventId));

    const outcomeEmoji: Record<string, string> = {
      passed: "✅", failed: "❌", delayed: "⏳",
      cancelled: "🚫", occurred: "📌", unknown: "❓",
    };

    const emoji = outcomeEmoji[outcome] ?? "📌";
    const body = `${emoji} ${title} — ${explanation.substring(0, 100)}`;

    for (const watcher of watchers) {
      const subs = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.userId, watcher.userId!));

      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify({ title: "Witness Update", body, url: "/witness" })
          );
        } catch {}
      }
    }
  } catch (err) {
    console.error("Witness notification error:", err);
  }
}