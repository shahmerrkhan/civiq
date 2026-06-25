import { db } from "@/db";
import { pollVotes, users, userActivity } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { VoteSchema } from "@/lib/schemas";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = VoteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  const { pollId, optionIndex } = parsed.data;

  const user = await db.select({ compassPosition: users.compassPosition }).from(users).where(eq(users.id, userId));
  const pos = (user[0]?.compassPosition as { x: number; y: number }) ?? { x: 0, y: 0 };
  const leaning = pos.x < -0.1 ? "Left" : pos.x > 0.1 ? "Right" : "Centre";

  try {
    await db.insert(pollVotes).values({ pollId, userId, optionIndex, userLeaning: leaning });
  } catch (err: any) {
    if (err?.code === "23505") return NextResponse.json({ error: "Already voted" }, { status: 409 });
    console.error("Poll vote error:", err);
    return NextResponse.json({ error: "Failed to record vote" }, { status: 500 });
  }

  await db.insert(userActivity).values({
    userId,
    action: "poll_vote",
    meta: { xp: 10, pollId },
  }).catch(() => {});

  return NextResponse.json({ success: true, pointsAwarded: 10 });
}