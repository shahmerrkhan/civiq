import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { userProgress, users } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await req.json();
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

  const existing = await db.select().from(userProgress).where(
    and(eq(userProgress.userId, userId), eq(userProgress.moduleSlug, slug))
  );
  if (existing.length > 0) return NextResponse.json({ success: true, already: true });

await db.insert(userProgress).values({
    userId,
    moduleSlug: slug,
    completed: true,
    completedAt: new Date(),
  });

  await db.update(users)
    .set({ civicScore: sql`COALESCE(civic_score, 0) + 20` })
    .where(eq(users.id, userId));

  return NextResponse.json({ success: true, pointsAwarded: 20 });
}