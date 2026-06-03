import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { points } = await req.json();
  if (!points || typeof points !== "number") return NextResponse.json({ error: "Invalid points" }, { status: 400 });

  await db.update(users)
    .set({ civicScore: sql`COALESCE(civic_score, 0) + ${points}` })
    .where(eq(users.id, userId));

  const updated = await db.select({ civicScore: users.civicScore }).from(users).where(eq(users.id, userId));
  return NextResponse.json({ civicScore: updated[0]?.civicScore ?? 0 });
}