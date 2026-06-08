import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, sql } from "@/db";
import { debateMessages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { DebateMessageSchema } from "@/lib/schemas";

export async function POST(req: Request) {
try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get("roomId");
    if (!roomId) return NextResponse.json({ error: "roomId required" }, { status: 400 });

    const messages = await sql`
      SELECT * FROM debate_messages WHERE room_id = ${roomId} ORDER BY created_at ASC
    `;
    return NextResponse.json({ messages });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    const parsed = DebateMessageSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    const { roomId, type, content, steelmanApproved } = parsed.data;

    // Check room exists and user belongs to it
    const room = await sql`SELECT * FROM debate_rooms WHERE id = ${roomId}`;
    if (!room[0]) return NextResponse.json({ error: "Room not found" }, { status: 404 });
    if (room[0].user_a_id !== userId && room[0].user_b_id !== userId) {
      return NextResponse.json({ error: "Not a participant" }, { status: 403 });
    }
    if (room[0].status === "closed") {
      return NextResponse.json({ error: "Room has closed" }, { status: 400 });
    }

    // Enforce steelman must come before argument
    if (type === "argument") {
      const previousMessages = await sql`
        SELECT * FROM debate_messages
        WHERE room_id = ${roomId} AND user_id = ${userId} AND type = 'steelman' AND steelman_approved = true
      `;
      if (previousMessages.length === 0) {
        return NextResponse.json({ error: "You must submit an approved steelman first" }, { status: 400 });
      }
    }

    const inserted = await db.insert(debateMessages).values({
      roomId,
      userId,
      type,
      content: content.trim(),
      steelmanApproved: steelmanApproved ?? null,
    }).returning();

    return NextResponse.json({ message: inserted[0] });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}