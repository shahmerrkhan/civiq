import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { witnessEvents } from "@/db/schema";
import { eq } from "drizzle-orm";

const ADMIN_IDS = ["user_3FjyZGikYeG9xNJm9uDh06WkLJh", "user_3FlZv0AydohOEdXeSRpOMucj6VD"];

async function checkAdmin() {
  const { userId } = await auth();
  return userId && ADMIN_IDS.includes(userId);
}

export async function POST(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const [event] = await db.insert(witnessEvents).values({
    title: body.title,
    description: body.description,
    category: body.category,
    deadlineAt: new Date(body.deadlineAt),
    sourceUrl: body.sourceUrl || null,
    weekStart: body.weekStart,
    status: "pending",
  }).returning();
  return NextResponse.json({ event });
}

export async function PATCH(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, outcome, outcomeExplanation, approvePending } = await req.json();

  if (approvePending) {
    const [event] = await db.update(witnessEvents)
      .set({ status: "upcoming", updatedAt: new Date() })
      .where(eq(witnessEvents.id, id))
      .returning();
    return NextResponse.json({ event });
  }

  const [event] = await db.update(witnessEvents)
    .set({ status: "resolved", outcome, outcomeExplanation, updatedAt: new Date() })
    .where(eq(witnessEvents.id, id))
    .returning();
  return NextResponse.json({ event });
}

export async function DELETE(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  await db.delete(witnessEvents).where(eq(witnessEvents.id, id));
  return NextResponse.json({ ok: true });
}