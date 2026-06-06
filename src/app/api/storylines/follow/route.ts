import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { storylineFollows } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { StorylineFollowSchema } from "@/lib/schemas";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
  const parsed = StorylineFollowSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  const { storylineId } = parsed.data;
  
  const existing = await db
    .select()
    .from(storylineFollows)
    .where(and(eq(storylineFollows.userId, userId), eq(storylineFollows.storylineId, storylineId)))
    .limit(1);

  if (existing.length > 0) {
    await db
      .delete(storylineFollows)
      .where(and(eq(storylineFollows.userId, userId), eq(storylineFollows.storylineId, storylineId)));
    return NextResponse.json({ following: false });
  }

  await db.insert(storylineFollows).values({ userId, storylineId });
  return NextResponse.json({ following: true });
}