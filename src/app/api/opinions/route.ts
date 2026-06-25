import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { userOpinions, userActivity } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { OpinionSchema } from "@/lib/schemas";
import sanitizeHtml from "sanitize-html";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const opinions = await db
      .select()
      .from(userOpinions)
      .where(eq(userOpinions.userId, userId))
      .orderBy(userOpinions.createdAt);

    return NextResponse.json({ opinions });
  } catch (err) {
    console.error("Opinions GET error:", err);
    return NextResponse.json({ error: "Failed to load opinions" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
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
      opinion: sanitizeHtml(opinion.trim(), { allowedTags: [], allowedAttributes: {} }),
    }).onConflictDoNothing();

    await db.insert(userActivity).values({
      userId,
      action: "opinion",
      meta: { xp: 15, cardId },
    }).catch(() => {});

    return NextResponse.json({ success: true, pointsAwarded: 15 });
  } catch (err) {
    console.error("Opinions POST error:", err);
    return NextResponse.json({ error: "Failed to save opinion" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    const opinionId = body?.id;
    if (!opinionId || typeof opinionId !== "string") {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const existing = await db
      .select()
      .from(userOpinions)
      .where(and(eq(userOpinions.id, opinionId), eq(userOpinions.userId, userId)))
      .limit(1);

    if (!existing[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.delete(userOpinions).where(eq(userOpinions.id, opinionId));
    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("Opinions DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete opinion" }, { status: 500 });
  }
}