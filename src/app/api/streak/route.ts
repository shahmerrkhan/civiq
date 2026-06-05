import { auth } from "@clerk/nextjs/server";
import { sql } from "@/db";
import { db } from "@/db";
import { userActivity } from "@/db/schema";
import { NextResponse } from "next/server";

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}
function getYesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const today = getTodayStr();
    const yesterday = getYesterdayStr();

    const rows = await sql`SELECT streak_count, last_streak_date FROM users WHERE id = ${userId}`;
    if (!rows[0]) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { streak_count, last_streak_date } = rows[0];

    if (last_streak_date === today) {
      return NextResponse.json({ streak: streak_count, alreadyCounted: true });
    }

    const newStreak = last_streak_date === yesterday ? (streak_count || 0) + 1 : 1;

    await sql`UPDATE users SET streak_count = ${newStreak}, last_streak_date = ${today} WHERE id = ${userId}`;

    // Log activity
    await db.insert(userActivity).values({
      userId,
      action: "streak",
      meta: { streak: newStreak, date: today },
    }).catch(() => {});

    return NextResponse.json({ streak: newStreak, alreadyCounted: false });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ streak: 0 });

    const rows = await sql`SELECT streak_count, last_streak_date FROM users WHERE id = ${userId}`;
    if (!rows[0]) return NextResponse.json({ streak: 0 });

    const today = getTodayStr();
    const yesterday = getYesterdayStr();
    const last = rows[0].last_streak_date;
    const isActive = last === today || last === yesterday;

    // Auto-increment streak on GET if not yet counted today
    if (last !== today) {
      const newStreak = last === yesterday ? (rows[0].streak_count || 0) + 1 : 1;
      await sql`UPDATE users SET streak_count = ${newStreak}, last_streak_date = ${today} WHERE id = ${userId}`.catch(() => {});
      return NextResponse.json({ streak: newStreak, lastDate: today });
    }

    return NextResponse.json({
      streak: isActive ? (rows[0].streak_count || 0) : 0,
      lastDate: last,
    });
  } catch {
    return NextResponse.json({ streak: 0 });
  }
}
