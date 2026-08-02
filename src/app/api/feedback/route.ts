import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { feedback } from "@/db/schema";
import { NextResponse } from "next/server";
import { FeedbackSchema } from "@/lib/schemas";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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

    resend.emails.send({
      from: "Civiq Feedback <feedback@getciviq.org>",
      to: "rehan.mazid@gmail.com",
      subject: `New feedback: ${category}`,
      html:
        `<p><strong>Category:</strong> ${escapeHtml(category)}</p>` +
        `<p><strong>From:</strong> ${escapeHtml(email ?? "Anonymous")}</p>` +
        `<p><strong>User:</strong> ${escapeHtml(userId ?? "signed out")}</p>` +
        `<p><strong>Message:</strong></p><p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`,
    }).catch((err) => console.error("Feedback email failed:", err));

    return NextResponse.json({ submitted: true });
  } catch (err) {
    console.error("Feedback POST error:", err);
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }
}
