import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { sql } from "@/db";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "No stripe secret key" }, { status: 500 });
  }
  const stripe = new Stripe(STRIPE_SECRET_KEY);
  if (!WEBHOOK_SECRET) {
    return NextResponse.json({ error: "No webhook secret" }, { status: 500 });
  }

  const headerPayload = await headers();
  const signature = headerPayload.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      await sql`
        INSERT INTO donations (stripe_session_id, stripe_payment_intent_id, email, name, amount_total, currency, status, created_at)
        VALUES (
          ${session.id},
          ${typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null},
          ${session.customer_details?.email ?? null},
          ${session.customer_details?.name ?? null},
          ${session.amount_total ?? 0},
          ${session.currency ?? "cad"},
          'completed',
          NOW()
        )
        ON CONFLICT (stripe_session_id) DO NOTHING
      `;
    }
  } catch (err) {
    console.error("Stripe webhook DB error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
