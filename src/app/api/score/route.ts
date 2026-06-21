import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { userActivity } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ xp: 0 });

  const rows = await db
    .select()
    .from(userActivity)
    .where(eq(userActivity.userId, userId));

  const xp = rows.reduce((sum, r) => sum + ((r.meta as any)?.xp ?? 0), 0);
  return NextResponse.json({ xp });
}
