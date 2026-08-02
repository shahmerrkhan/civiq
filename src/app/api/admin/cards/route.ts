import { db } from "@/db";
import { contentCards, polls } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { AdminCardUpdateSchema, AdminCardCreateSchema, AdminIdSchema } from "@/lib/schemas";

export const revalidate = 0;

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
  if (!(await isAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const parsed = AdminCardUpdateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    const { id, approved, title, summary, category, sourceName, sourceUrl, deepDive, stat } = parsed.data;

    const fields: Record<string, unknown> = {};
    if (approved !== undefined) fields.approved = approved;
    if (title !== undefined) fields.title = title;
    if (summary !== undefined) fields.summary = summary;
    if (category !== undefined) fields.category = category;
    if (sourceName !== undefined) fields.sourceName = sourceName;
    if (sourceUrl !== undefined) fields.sourceUrl = sourceUrl;
    if (deepDive !== undefined) fields.deepDive = deepDive;
    if (stat !== undefined) fields.stat = stat;

    if (Object.keys(fields).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    await db.update(contentCards).set(fields).where(eq(contentCards.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Admin cards PATCH error:", err);
    return NextResponse.json({ error: "Failed to update card" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const parsed = AdminIdSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    const { id } = parsed.data;

    await db.delete(polls).where(eq(polls.cardId, id));
    await db.delete(contentCards).where(eq(contentCards.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Admin cards DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete card" }, { status: 500 });
  }
}


export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const parsed = AdminCardCreateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    const d = parsed.data;

    const [card] = await db.insert(contentCards).values({
      title: d.title,
      summary: d.summary,
      category: d.category ?? null,
      sourceName: d.sourceName ?? null,
      sourceUrl: d.sourceUrl || null,
      stat: d.stat ?? null,
      deepDive: d.deepDive ?? null,
      perspectives: d.perspectives ?? null,
      approved: false,
      publishedAt: new Date(),
    }).returning();

    let poll = null;
    const options = (d.pollOptions ?? []).filter((o) => o.trim());
    if (d.pollQuestion?.trim() && options.length >= 2) {
      [poll] = await db.insert(polls).values({
        cardId: card.id,
        question: d.pollQuestion.trim(),
        options,
      }).returning();
    }

    return NextResponse.json({ card: { ...card, poll } });
  } catch (err) {
    console.error("Admin cards POST error:", err);
    return NextResponse.json({ error: "Failed to create card" }, { status: 500 });
  }
}
