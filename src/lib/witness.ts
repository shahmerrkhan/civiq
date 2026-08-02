import { db } from "@/db";
import { witnessEvents, witnessWatches, pushSubscriptions } from "@/db/schema";
import { eq, and, lte } from "drizzle-orm";
import webpush from "web-push";
import { geminiGenerate } from "@/lib/gemini";
import { withLock } from "@/lib/lock";

export async function generateWeeklyWitnessEvents(weekStart: string) {
  const existing = await db
    .select()
    .from(witnessEvents)
    .where(eq(witnessEvents.weekStart, weekStart));

  if (existing.length >= 5) return existing;

  // This runs off a public GET, so concurrent first-of-the-week requests would
  // otherwise each fire their own grounded generation.
  return withLock(
    `civiq:lock:witness:${weekStart}`,
    120,
    () => doGenerateWeeklyWitnessEvents(weekStart),
    existing
  );
}

async function doGenerateWeeklyWitnessEvents(weekStart: string) {
  const existing = await db
    .select()
    .from(witnessEvents)
    .where(eq(witnessEvents.weekStart, weekStart));

  if (existing.length >= 5) return existing;

  const now = new Date();

  const raw = await geminiGenerate({
    prompt: `You are generating "Witness Events" for Civiq, a civic education platform for Ontario youth. These are real upcoming Ontario political decisions, court dates, bill readings, elections, budget votes, or policy announcements.

Today is ${now.toISOString().split("T")[0]}. Generate exactly 5 events.

CRITICAL ACCURACY RULES — a human editor will fact-check every event before it goes live:
- JURISDICTION: Every event must be clearly Ontario provincial OR explicitly labeled federal/municipal. Do NOT mix them up. High-speed rail (e.g. Alto/VIA) is FEDERAL. Toronto municipal elections are MUNICIPAL. Ontario Legislature bills are PROVINCIAL.
- LEGISLATURE SESSION: The Ontario Legislature typically sits October-December and February-June. If the house is not in session, do NOT generate bill reading or confidence motion events.
- BILLS: Only reference bills by number if you are certain they exist and have not already received Royal Assent. If unsure, describe the policy area without a bill number.
- COURT CASES: Only generate court events if a real case is ongoing. Do not invent court appeals or legal challenges.
- BUDGET: Ontario's budget is typically tabled in late March or April. Do not generate budget events outside that window unless referencing a real supplementary estimate.
- ELECTIONS: Toronto municipal elections are in October of election years. Do not invent election dates.
- If you are uncertain about any fact, omit that event and replace it with one you are confident about.
- sourceUrl must be a real, working URL from ola.org, ontario.ca, toronto.ca, canada.ca, or a major Canadian news outlet. Do not invent URLs.

Return ONLY valid JSON, no markdown, no backticks:
{
  "events": [
    {
      "title": "Short punchy title, max 10 words.",
      "description": "2-3 sentences. What is this, why does it matter to young Ontarians, what happens next.",
      "category": "Bills | Courts | Elections | Budget | Policy | Municipal | Federal",
      "jurisdiction": "provincial | federal | municipal",
      "deadlineDays": 7,
      "sourceUrl": "https://real-url-here.ca"
    }
  ]
}

- deadlineDays must be between 1 and 30
- Vary categories
- Make them genuinely interesting to a 16-25 year old`,
    maxTokens: 2500,
    grounding: true,
  });

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
      const raw = await geminiGenerate({
        prompt: `You are resolving a political event for Civiq.

Event: "${event.title}"
Description: "${event.description}"
Deadline was: ${event.deadlineAt.toISOString().split("T")[0]}

Based on your knowledge of Ontario/Canadian politics, what actually happened? Did it occur as expected, get delayed, pass, fail, or something else?

Return ONLY valid JSON, no markdown:
{
  "outcome": "passed" | "failed" | "delayed" | "cancelled" | "occurred" | "unknown",
  "explanation": "1-2 sentences on what actually happened."
}`,
        maxTokens: 400,
        grounding: true,
      });

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
    // The public key is only ever set as NEXT_PUBLIC_VAPID_PUBLIC_KEY; reading
    // VAPID_PUBLIC_KEY silently disabled these notifications entirely.
    const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? process.env.VAPID_PUBLIC_KEY;
    if (!vapidPublic || !process.env.VAPID_PRIVATE_KEY) return;

    webpush.setVapidDetails(
      process.env.VAPID_EMAIL ?? "mailto:civiq@civicclarityfoundation.org",
      vapidPublic,
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
