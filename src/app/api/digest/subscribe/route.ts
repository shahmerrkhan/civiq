import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/db";

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await sql`UPDATE users SET digest_subscribed = true WHERE id = ${userId}`;

  return NextResponse.json({ subscribed: true });
}
