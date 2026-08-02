import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { contentCards, users, userActivity } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { PerspectiveViewSchema } from "@/lib/schemas";

/**
 * Records that a user opened a specific perspective on a real content card.
 *
 * Whether the view counts as "reading the other side" is decided here from the
 * user's stored compass position — the client only reports which perspective it
 * rendered, it never gets to assert that the view was an opposing one.
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = PerspectiveViewSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    const { cardDbId, perspective } = parsed.data;

    // The card must actually exist and be published.
    const card = await db
      .select({ id: contentCards.id })
      .from(contentCards)
      .where(and(eq(contentCards.id, cardDbId), eq(contentCards.approved, true)))
      .limit(1);

    if (!card[0]) return NextResponse.json({ error: "Card not found" }, { status: 404 });

    const userRow = await db
      .select({ compassPosition: users.compassPosition })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const pos = (userRow[0]?.compassPosition as { x: number; y: number } | null) ?? { x: 0, y: 0 };
    const ownLeaning = pos.x < -0.1 ? "left" : pos.x > 0.1 ? "right" : "centre";
    const opposing = perspective !== ownLeaning;

    // One row per user/card/perspective — re-opening the same tab must not
    // stack up activity rows.
    const already = await db
      .select({ id: userActivity.id })
      .from(userActivity)
      .where(and(
        eq(userActivity.userId, userId),
        eq(userActivity.action, "perspective_view"),
        sql`${userActivity.meta}->>'cardDbId' = ${cardDbId}`,
        sql`${userActivity.meta}->>'perspective' = ${perspective}`
      ))
      .limit(1);

    if (already[0]) return NextResponse.json({ recorded: true, opposing, duplicate: true });

    await db.insert(userActivity).values({
      userId,
      action: "perspective_view",
      meta: { cardDbId, perspective, opposing },
    });

    return NextResponse.json({ recorded: true, opposing });
  } catch (err) {
    console.error("Perspective view error:", err);
    return NextResponse.json({ error: "Failed to record view" }, { status: 500 });
  }
}
