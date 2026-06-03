import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { userOpinions, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { OpinionSchema } from "@/lib/schemas";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const opinions = await db
    .select()
    .from(userOpinions)
    .where(eq(userOpinions.userId, userId))
    .orderBy(userOpinions.createdAt);

  return NextResponse.json({ opinions });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = OpinionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  const { cardId, opinion } = parsed.data;

  if (!cardId || !opinion?.trim()) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

await db.insert(userOpinions).values({
    userId,
    cardId,
    opinion: opinion.trim(),
  }).onConflictDoNothing();

  await db.update(users)
    .set({ civicScore: sql`COALESCE(civic_score, 0) + 15` })
    .where(eq(users.id, userId));

  return NextResponse.json({ success: true, pointsAwarded: 15 });
}