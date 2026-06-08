import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { sql } from "@/db";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    return NextResponse.json({ error: "No webhook secret" }, { status: 500 });
  }

  const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: any;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (evt.type === "user.created") {
    const { id, email_addresses, username } = evt.data;
    const email = email_addresses?.find((e: any) => e.id === evt.data.primary_email_address_id)?.email_address 
    ?? email_addresses?.[0]?.email_address 
    ?? "";

    await sql`
      INSERT INTO users (id, email, username, onboarding_complete, streak_count, created_at)
      VALUES (${id}, ${email}, ${username ?? null}, false, 0, NOW())
      ON CONFLICT (id) DO NOTHING
    `;
  }

  return NextResponse.json({ received: true });
}