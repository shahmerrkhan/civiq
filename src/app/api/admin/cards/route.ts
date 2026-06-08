import { db } from "@/db";
import { contentCards, polls } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

const ADMIN_EMAILS = ["m.shahmeer.khan8@gmail.com", "rehan.mazid@gmail.com"];

async function checkAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = user.emailAddresses?.[0]?.emailAddress ?? "";
  return ADMIN_EMAILS.includes(email);
}

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
    return NextResponse.json({ cards: result });
  } catch (err) {
    console.error("feed error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }

  }

export async function PATCH(req: Request) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id, approved } = await req.json();
    await db.update(contentCards).set({ approved }).where(eq(contentCards.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await req.json();
    await db.delete(polls).where(eq(polls.cardId, id));
    await db.delete(contentCards).where(eq(contentCards.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}   
