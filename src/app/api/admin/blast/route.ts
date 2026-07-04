import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import webpush from "web-push";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";

const ADMIN_IDS = ["user_3FjyZGikYeG9xNJm9uDh06WkLJh", "user_3FlZv0AydohOEdXeSRpOMucj6VD"];

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId || !ADMIN_IDS.includes(userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    webpush.setVapidDetails(
      process.env.VAPID_EMAIL!,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );

    const { title, body, url } = await req.json();
    if (!title?.trim() || !body?.trim()) {
      return NextResponse.json({ error: "Title and body required" }, { status: 400 });
    }

    const subs = await db.select().from(pushSubscriptions);
    if (!subs.length) return NextResponse.json({ sent: 0, failed: 0 });

    const payload = JSON.stringify({
      title: title.trim(),
      body: body.trim(),
      url: url?.trim() || "/dashboard",
      tag: `admin-blast-${Date.now()}`,
    });

    // Send in batches of 100 to avoid OOMing the serverless function
    const BATCH_SIZE = 100;
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < subs.length; i += BATCH_SIZE) {
      const batch = subs.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map((sub) =>
          webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          )
        )
      );
      sent += results.filter((r) => r.status === "fulfilled").length;
      failed += results.filter((r) => r.status === "rejected").length;
    }

    return NextResponse.json({ sent, failed });
  } catch (err) {
    console.error("Blast error:", err);
    return NextResponse.json({ error: "Failed to send notifications" }, { status: 500 });
  }
}
