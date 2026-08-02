import { db } from "@/db";
import { pollVotes, polls, users, userActivity } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { VoteSchema } from "@/lib/schemas";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    const parsed = VoteSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    const { pollId, optionIndex } = parsed.data;

    // poll_votes.poll_id has no FK, so an unchecked pollId lets anyone mint
    // votes for polls that don't exist and inflate their civic score.
    const pollRows = await db
      .select({ options: polls.options, expiresAt: polls.expiresAt })
      .from(polls)
      .where(eq(polls.id, pollId))
      .limit(1);

    if (!pollRows[0]) return NextResponse.json({ error: "Poll not found" }, { status: 404 });

    const options = pollRows[0].options as unknown[];
    if (!Array.isArray(options) || optionIndex >= options.length) {
      return NextResponse.json({ error: "Invalid option" }, { status: 400 });
    }
    if (pollRows[0].expiresAt && new Date(pollRows[0].expiresAt) < new Date()) {
      return NextResponse.json({ error: "This poll has closed" }, { status: 400 });
    }

    const userRows = await db
      .select({ compassPosition: users.compassPosition })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const pos = (userRows[0]?.compassPosition as { x: number; y: number } | null) ?? { x: 0, y: 0 };
    const leaning = pos.x < -0.1 ? "Left" : pos.x > 0.1 ? "Right" : "Centre";

    try {
      await db.insert(pollVotes).values({ pollId, userId, optionIndex, userLeaning: leaning });
    } catch (err) {
      const e = err as { code?: string };
      if (e?.code === "23505") return NextResponse.json({ error: "Already voted" }, { status: 409 });
      throw err;
    }

    await db.insert(userActivity).values({
      userId,
      action: "poll_vote",
      meta: { xp: 10, pollId },
    }).catch(() => {});

    return NextResponse.json({ success: true, pointsAwarded: 10 });
  } catch (err) {
    console.error("Poll vote error:", err);
    return NextResponse.json({ error: "Failed to record vote" }, { status: 500 });
  }
}


