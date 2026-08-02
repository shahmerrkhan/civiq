import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { witnessEvents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isAdmin } from "@/lib/admin";
import {
  AdminWitnessCreateSchema,
  AdminWitnessPatchSchema,
  AdminIdSchema,
} from "@/lib/schemas";

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = AdminWitnessCreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const [event] = await db.insert(witnessEvents).values({
    title: parsed.data.title,
    description: parsed.data.description,
    category: parsed.data.category,
    deadlineAt: parsed.data.deadlineAt,
    sourceUrl: parsed.data.sourceUrl || null,
    weekStart: parsed.data.weekStart,
    status: "pending",
  }).returning();

  return NextResponse.json({ event });
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = AdminWitnessPatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  const { id, outcome, outcomeExplanation, approvePending } = parsed.data;

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
  if (!(await isAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = AdminIdSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  await db.delete(witnessEvents).where(eq(witnessEvents.id, parsed.data.id));
  return NextResponse.json({ ok: true });
}
