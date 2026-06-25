import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, sql } from "@/db";
import { debateRooms } from "@/db/schema";
import { eq, and, or, isNull } from "drizzle-orm";
import { DebateRoomSchema } from "@/lib/schemas";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    const parsed = DebateRoomSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    const { cardDbId, cardTitle, cardSummary, userLeaning } = parsed.data;
    
    // Clean up expired waiting rooms for this user
    await sql`
      UPDATE debate_rooms SET status = 'closed'
      WHERE user_a_id = ${userId}
        AND status = 'waiting'
        AND created_at < NOW() - INTERVAL '24 hours'
    `;

    // Check if user already has an active room for this card
    const existing = await db.select().from(debateRooms).where(
      and(
        eq(debateRooms.cardDbId, cardDbId),
        or(eq(debateRooms.userAId, userId), eq(debateRooms.userBId, userId))
      )
    );
    if (existing.length > 0) {
      return NextResponse.json({ room: existing[0] });
    }

    // Limit: max 5 open waiting rooms per user at a time
    const openWaiting = await sql`
      SELECT COUNT(*) as cnt FROM debate_rooms
      WHERE user_a_id = ${userId} AND status = 'waiting'
    `;
    if (Number(openWaiting[0]?.cnt ?? 0) >= 5) {
      return NextResponse.json({ error: "Too many open debate requests. Wait for someone to join one first." }, { status: 429 });
    }

    // Try to find a waiting room from someone with a different leaning
    const waiting = await sql`
      SELECT * FROM debate_rooms
      WHERE card_db_id = ${cardDbId}
        AND status = 'waiting'
        AND user_a_id != ${userId}
        AND (user_a_leaning != ${userLeaning} OR user_a_leaning IS NULL)
      ORDER BY created_at ASC
      LIMIT 1
    `;

    if (waiting.length > 0) {
      const room = waiting[0];
      const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
      await sql`
        UPDATE debate_rooms
        SET user_b_id = ${userId}, user_b_leaning = ${userLeaning},
            status = 'active', expires_at = ${expiresAt.toISOString()}
        WHERE id = ${room.id}
      `;
      const updated = await sql`SELECT * FROM debate_rooms WHERE id = ${room.id}`;
      return NextResponse.json({ room: updated[0] });
    }

    // No match found — create a waiting room
    const newRoom = await db.insert(debateRooms).values({
      cardDbId,
      cardTitle,
      cardSummary,
      userAId: userId,
      userALeaning: userLeaning,
      status: "waiting",
    }).returning();

    return NextResponse.json({ room: newRoom[0] });
  } catch (err) {
    console.error("debate/rooms error:", err);
    return NextResponse.json({ error: "Failed to create or join room" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get("roomId");
    if (!roomId) return NextResponse.json({ error: "roomId required" }, { status: 400 });

    const room = await sql`SELECT * FROM debate_rooms WHERE id = ${roomId}`;
    if (!room[0]) return NextResponse.json({ error: "Room not found" }, { status: 404 });

    // Check expiry
    if (room[0].expires_at && new Date(room[0].expires_at) < new Date()) {
      await sql`UPDATE debate_rooms SET status = 'closed' WHERE id = ${roomId}`;
      room[0].status = "closed";
    }

    return NextResponse.json({ room: room[0] });
  } catch (err) {
    console.error("Debate rooms GET error:", err);
    return NextResponse.json({ error: "Failed to load room" }, { status: 500 });
  }
}