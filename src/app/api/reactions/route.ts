import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { swipeReactions, userActivity } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ReactionSchema } from "@/lib/schemas";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = ReactionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  const { cardDbId, reaction } = parsed.data;

  const existing = await db
    .select()
    .from(swipeReactions)
    .where(and(eq(swipeReactions.userId, userId), eq(swipeReactions.cardDbId, cardDbId)))
    .limit(1);

  if (existing[0]) {
    if (existing[0].reaction === reaction) {
      await db.delete(swipeReactions).where(eq(swipeReactions.id, existing[0].id));
      return NextResponse.json({ reacted: false });
    }
    await db.update(swipeReactions)
      .set({ reaction })
      .where(eq(swipeReactions.id, existing[0].id));
    return NextResponse.json({ reacted: true, reaction });
  }

  await db.insert(swipeReactions).values({ userId, cardDbId, reaction });

  await db.insert(userActivity).values({
    userId,
    action: "reaction",
    meta: { cardDbId, reaction },
  }).catch(() => {});

  return NextResponse.json({ reacted: true, reaction });
}
