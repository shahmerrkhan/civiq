import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { storylineFollows } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { storylineId } = await req.json();

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