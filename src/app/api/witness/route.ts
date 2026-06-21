import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { witnessEvents, witnessWatches, userActivity, users } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { generateWeeklyWitnessEvents, resolveExpiredWitnessEvents } from "@/lib/witness";
import { WitnessWatchSchema } from "@/lib/schemas";

function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(diff);
  return monday.toISOString().split("T")[0];
}

export async function GET() {
  try {
    const { userId } = await auth();

    const weekStart = getWeekStart();
    await generateWeeklyWitnessEvents(weekStart);

    const events = await db
      .select()
      .from(witnessEvents)
      .orderBy(desc(witnessEvents.deadlineAt));

    const enriched = await Promise.all(
      events.map(async (e) => {
        const watchCount = await db
          .select()
          .from(witnessWatches)
          .where(eq(witnessWatches.eventId, e.id));

        let isWatching = false;
        if (userId) {
          const mine = await db
            .select()
            .from(witnessWatches)
            .where(and(eq(witnessWatches.userId, userId), eq(witnessWatches.eventId, e.id)))
            .limit(1);
          isWatching = mine.length > 0;
        }

        const msLeft = new Date(e.deadlineAt).getTime() - Date.now();
        const daysLeft = Math.max(0, Math.ceil(msLeft / 86400000));
        const hoursLeft = Math.max(0, Math.ceil(msLeft / 3600000));

        return {
          ...e,
          watchCount: watchCount.length,
          isWatching,
          daysLeft,
          hoursLeft,
          isUrgent: daysLeft <= 2 && e.status === "upcoming",
        };
      })
    );

    const upcoming = enriched.filter(e => e.status === "upcoming").sort((a, b) => a.daysLeft - b.daysLeft);
    const resolved = enriched.filter(e => e.status === "resolved");

    return NextResponse.json({ upcoming, resolved });
  } catch (err) {
    console.error("Witness GET error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    const parsed = WitnessWatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
    }

    const { eventId } = parsed.data;

    const existing = await db
      .select()
      .from(witnessWatches)
      .where(and(eq(witnessWatches.userId, userId), eq(witnessWatches.eventId, eventId)))
      .limit(1);

    if (existing.length > 0) {
      await db.delete(witnessWatches)
        .where(and(eq(witnessWatches.userId, userId), eq(witnessWatches.eventId, eventId)));
      return NextResponse.json({ watching: false });
    }

    await db.insert(witnessWatches).values({ userId, eventId });
    await db.insert(userActivity).values({ userId, action: "witness_watch", meta: { eventId, xp: 10 } });

    // Update streak
    const today = new Date().toISOString().slice(0, 10);
    const userRow = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (userRow[0]) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const last = userRow[0].lastStreakDate;
      const newStreak = last === today ? userRow[0].streakCount ?? 1 : last === yesterday ? (userRow[0].streakCount ?? 0) + 1 : 1;
      await db.update(users).set({ streakCount: newStreak, lastStreakDate: today }).where(eq(users.id, userId));
    }

    return NextResponse.json({ watching: true });
  } catch (err) {
    console.error("Witness POST error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}