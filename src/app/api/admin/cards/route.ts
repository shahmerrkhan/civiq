import { db } from "@/db";
import { Redis } from "@upstash/redis";
import { contentCards, polls } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

const ADMIN_EMAILS = ["m.shahmeer.khan8@gmail.com", "rehan.mazid@gmail.com"];

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

async function checkAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;

  const cacheKey = `civiq:admin:${userId}`;
  const cached = await redis.get<boolean>(cacheKey).catch(() => null);
  if (cached !== null) return cached;

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = user.emailAddresses?.[0]?.emailAddress ?? "";
  const isAdmin = ADMIN_EMAILS.includes(email);

  await redis.set(cacheKey, isAdmin, { ex: 300 }).catch(() => {});
  return isAdmin;
}

export const revalidate = 0;

export async function GET() {
  if (!await checkAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    console.error("Admin cards GET error:", err);
    return NextResponse.json({ error: "Failed to load cards" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const { id, ...fields } = body;
    await db.update(contentCards).set(fields).where(eq(contentCards.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Admin cards PATCH error:", err);
    return NextResponse.json({ error: "Failed to update card" }, { status: 500 });
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
    console.error("Admin cards DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete card" }, { status: 500 });
  }
}

