import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { bookmarks, userActivity } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { BookmarkSchema } from "@/lib/schemas";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const saved = await db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.userId, userId))
      .orderBy(bookmarks.savedAt);

    return NextResponse.json({ bookmarks: saved });
  } catch (err) {
    console.error("Bookmarks GET error:", err);
    return NextResponse.json({ error: "Failed to load bookmarks" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = BookmarkSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  const { cardTitle, cardSummary, cardCategory, cardSource, cardDbId } = parsed.data;

  const existing = await db
    .select()
    .from(bookmarks)
    .where(and(
      eq(bookmarks.userId, userId),
      cardDbId ? eq(bookmarks.cardDbId, cardDbId) : eq(bookmarks.cardTitle, cardTitle)
    ))
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
  } catch (err) {
    console.error("Bookmarks POST error:", err);
    return NextResponse.json({ error: "Failed to save bookmark" }, { status: 500 });
  }
}
