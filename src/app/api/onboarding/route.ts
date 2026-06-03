import { auth } from "@clerk/nextjs/server";
import { db, sql } from "@/db";
import { NextResponse } from "next/server";
import { OnboardingSchema } from "@/lib/schemas";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    console.log("userId:", userId);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = OnboardingSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    const { compassPosition } = parsed.data;

    console.log("compassPosition:", compassPosition);

    await sql`
      INSERT INTO users (id, email, compass_position, onboarding_complete)
      VALUES (${userId}, '', ${JSON.stringify(compassPosition)}, true)
      ON CONFLICT (id) DO UPDATE
      SET compass_position = ${JSON.stringify(compassPosition)}, onboarding_complete = true
    `;

    console.log("saved successfully");
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("onboarding error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}