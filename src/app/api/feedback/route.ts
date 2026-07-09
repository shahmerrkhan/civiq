import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { feedback } from "@/db/schema";
import { NextResponse } from "next/server";
import { FeedbackSchema } from "@/lib/schemas";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    const body = await req.json().catch(() => null);
    const parsed = FeedbackSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

    const { email, category, message } = parsed.data;

    await db.insert(feedback).values({
      userId: userId ?? null,
      email: email ?? null,
      category,
      message,
    });

    return NextResponse.json({ submitted: true });
  } catch (err) {
    console.error("Feedback POST error:", err);
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }
}