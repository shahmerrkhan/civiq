import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { witnessEvents, witnessWatches, userActivity } from "@/db/schema";
import { eq, desc, and, inArray, sql } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { generateWeeklyWitnessEvents } from "@/lib/witness";
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

    const eventIds = events.map(e => e.id);

    const [allWatches, myWatches] = await Promise.all([
      eventIds.length > 0
        ? db.select().from(witnessWatches).where(inArray(witnessWatches.eventId, eventIds))
        : Promise.resolve([]),
      userId && eventIds.length > 0
        ? db.select().from(witnessWatches).where(
            and(eq(witnessWatches.userId, userId), inArray(witnessWatches.eventId, eventIds))
          )
        : Promise.resolve([]),
    ]);

    const watchCountMap: Record<string, number> = {};
    for (const w of allWatches) {
      if (!w.eventId) continue;
      watchCountMap[w.eventId] = (watchCountMap[w.eventId] ?? 0) + 1;
    }
    const myWatchSet = new Set(myWatches.map(w => w.eventId));

    const enriched = events.map((e) => {
      const msLeft = new Date(e.deadlineAt).getTime() - Date.now();
      const daysLeft = Math.max(0, Math.ceil(msLeft / 86400000));
      const hoursLeft = Math.max(0, Math.ceil(msLeft / 3600000));
      return {
        ...e,
        watchCount: watchCountMap[e.id] ?? 0,
        isWatching: myWatchSet.has(e.id),
        daysLeft,
        hoursLeft,
        isUrgent: daysLeft <= 2 && e.status === "upcoming",
      };
    });

    const upcoming = enriched.filter(e => e.status === "upcoming").sort((a, b) => a.daysLeft - b.daysLeft);
    const resolved = enriched.filter(e => e.status === "resolved");

    return NextResponse.json({ upcoming, resolved });
  } catch (err) {
    console.error("Witness GET error:", err);
    return NextResponse.json({ error: "Failed to load events" }, { status: 500 });
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

    // Award XP only the first time this user watches this event — otherwise
    // toggling watch/unwatch mints unlimited XP.
    const alreadyAwarded = await db
      .select({ id: userActivity.id })
      .from(userActivity)
      .where(and(
        eq(userActivity.userId, userId),
        eq(userActivity.action, "witness_watch"),
        sql`${userActivity.meta}->>'eventId' = ${eventId}`
      ))
      .limit(1);

    if (alreadyAwarded.length === 0) {
      await db.insert(userActivity).values({ userId, action: "witness_watch", meta: { eventId, xp: 10 } });
    }

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

    return NextResponse.json({ watching: true });
  } catch (err) {
    console.error("Witness POST error:", err);
    return NextResponse.json({ error: "Failed to update watch" }, { status: 500 });
  }
}
