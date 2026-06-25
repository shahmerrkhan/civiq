import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { userProgress, userActivity } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ProgressSchema } from "@/lib/schemas";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rows = await db
      .select({ moduleSlug: userProgress.moduleSlug })
      .from(userProgress)
      .where(eq(userProgress.userId, userId));

    return NextResponse.json({ slugs: rows.map(r => r.moduleSlug).filter(Boolean) });
  } catch (err) {
    console.error("Progress GET error:", err);
    return NextResponse.json({ error: "Failed to load progress" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    const parsed = ProgressSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    const { slug } = parsed.data;

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

    await db.insert(userActivity).values({
      userId,
      action: "module_complete",
      meta: { xp: 20, slug },
    });

    return NextResponse.json({ success: true, pointsAwarded: 20 });
  } catch (err) {
    console.error("Progress POST error:", err);
    return NextResponse.json({ error: "Failed to save progress" }, { status: 500 });
  }
}