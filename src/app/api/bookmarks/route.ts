import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { bookmarks } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { BookmarkSchema } from "@/lib/schemas";

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
    const parsed = BookmarkSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    const { cardTitle, cardSummary, cardCategory, cardSource } = parsed.data;

  // Toggle — if already bookmarked remove it
  const existing = await db
    .select()
    .from(bookmarks)
    .where(and(eq(bookmarks.userId, userId), eq(bookmarks.cardTitle, cardTitle)))
    .limit(1);

  if (existing[0]) {
    await db.delete(bookmarks).where(eq(bookmarks.id, existing[0].id));
    return NextResponse.json({ bookmarked: false });
  }

  await (db.insert(bookmarks) as any).values({
    userId,
    cardTitle,
    cardSummary,
    cardCategory: cardCategory || null,
    cardSource: cardSource || null,
  });

  return NextResponse.json({ bookmarked: true });
}