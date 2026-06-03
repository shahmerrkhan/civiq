import { db } from "@/db";
import { contentCards, polls } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

export const revalidate = 0;

export async function GET() {
  try {
    const cards = await db
      .select()
      .from(contentCards)
      .where(eq(contentCards.approved, true))
      .orderBy(contentCards.publishedAt);

    const cardIds = cards.map((c) => c.id);

    let cardPolls: (typeof polls.$inferSelect)[] = [];
    if (cardIds.length > 0) {
      cardPolls = await db
        .select()
        .from(polls)
        .where(inArray(polls.cardId, cardIds));
    }

    const pollsByCardId = Object.fromEntries(
      cardPolls.map((p) => [p.cardId, p])
    );

    const result = cards.map((card) => ({
      ...card,
      poll: pollsByCardId[card.id] ?? null,
    }));
1
    return NextResponse.json({ cards: result });
  } catch (err) {
    console.error("feed error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}   