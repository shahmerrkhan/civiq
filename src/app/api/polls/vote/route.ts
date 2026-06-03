import { db } from "@/db";
import { pollVotes, users } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and, sql } from "drizzle-orm";import { NextResponse } from "next/server";
import { VoteSchema } from "@/lib/schemas";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const body = await req.json();
  const parsed = VoteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  const { pollId, optionIndex } = parsed.data;

  const existing = await db.select().from(pollVotes).where(
    and(eq(pollVotes.pollId, pollId), eq(pollVotes.userId, userId))
  );
  if (existing.length > 0) return NextResponse.json({ error: "Already voted" }, { status: 409 });

  const user = await db.select({ compassPosition: users.compassPosition }).from(users).where(eq(users.id, userId));
  const pos = (user[0]?.compassPosition as { x: number; y: number }) ?? { x: 0, y: 0 };
  const leaning = pos.x < -0.1 ? "Left" : pos.x > 0.1 ? "Right" : "Centre";

await db.insert(pollVotes).values({ pollId, userId, optionIndex, userLeaning: leaning });
  await db.update(users)
  .set({ streakCount: sql`COALESCE(streak_count, 0) + 0` })
  .where(eq(users.id, userId));
  return NextResponse.json({ success: true, pointsAwarded: 10 });
}