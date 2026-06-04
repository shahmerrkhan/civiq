import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { bookmarks, userActivity } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const saved = await db
    .select()
    .from(bookmarks)
    .where(eq(bookmarks.userId, userId))
    .orderBy(bookmarks.savedAt);

  return NextResponse.json({ bookmarks: saved });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { cardTitle, cardSummary, cardCategory, cardSource, cardDbId } = body;
  if (!cardTitle || !cardSummary) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const existing = await db
    .select()
    .from(bookmarks)
    .where(and(eq(bookmarks.userId, userId), eq(bookmarks.cardTitle, cardTitle)))
    .limit(1);

  if (existing[0]) {
    await db.delete(bookmarks).where(eq(bookmarks.id, existing[0].id));
    return NextResponse.json({ bookmarked: false });
  }

  await db.insert(bookmarks).values({
    userId,
    cardDbId: cardDbId ?? null,
    cardTitle,
    cardSummary,
    cardCategory: cardCategory ?? null,
    cardSource: cardSource ?? null,
  });

  // Track activity
  await db.insert(userActivity).values({
    userId,
    action: "bookmark",
    meta: { cardTitle, cardCategory },
  }).catch(() => {});

  return NextResponse.json({ bookmarked: true });
}