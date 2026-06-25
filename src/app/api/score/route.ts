import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ xp: 0 });

  const { sql: rawSql } = await import("@/db");
  const rows = await rawSql`
    SELECT COALESCE(SUM((meta->>'xp')::int), 0) AS xp
    FROM user_activity
    WHERE user_id = ${userId}
      AND meta->>'xp' IS NOT NULL
  `;
  const xp = Number(rows[0]?.xp ?? 0);
  return NextResponse.json({ xp });
}
