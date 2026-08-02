import { auth } from "@clerk/nextjs/server";
import { sql } from "@/db";
import { NextResponse } from "next/server";
import { OnboardingSchema } from "@/lib/schemas";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = OnboardingSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    const { compassPosition, digestSubscribed } = parsed.data;

    await sql`
      INSERT INTO users (id, email, compass_position, onboarding_complete, digest_subscribed)
      VALUES (${userId}, '', ${JSON.stringify(compassPosition)}, true, ${digestSubscribed})
      ON CONFLICT (id) DO UPDATE
      SET compass_position = ${JSON.stringify(compassPosition)},
          onboarding_complete = true,
          digest_subscribed = ${digestSubscribed}
    `;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("onboarding error:", err);
    return NextResponse.json({ error: "Onboarding failed" }, { status: 500 });
  }
}

