import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/db";
import { DigestSubscribeSchema } from "@/lib/schemas";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await sql`SELECT digest_subscribed FROM users WHERE id = ${userId}`;
  return NextResponse.json({ subscribed: rows[0]?.digest_subscribed === true });
}

// Explicit subscribe/unsubscribe. The body is required: this used to be a
// no-body "always subscribe" endpoint, which made accidental opt-in trivial
// and gave users no way back out.
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = DigestSubscribeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }
  const { subscribed } = parsed.data;

  await sql`UPDATE users SET digest_subscribed = ${subscribed} WHERE id = ${userId}`;

  return NextResponse.json({ subscribed });
}
