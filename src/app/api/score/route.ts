import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/db";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rows = await sql`
      SELECT COALESCE(SUM((meta->>'xp')::int), 0) AS xp
      FROM user_activity
      WHERE user_id = ${userId}
        AND meta->>'xp' IS NOT NULL
    `;
    const xp = Number(rows[0]?.xp ?? 0);
    return NextResponse.json({ xp });
  } catch (err) {
    console.error("Score GET error:", err);
    return NextResponse.json({ error: "Failed to load score" }, { status: 500 });
  }
}