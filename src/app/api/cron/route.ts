import { NextResponse } from "next/server";
import webpush from "web-push";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";

const MESSAGES = [
  { title: "Good morning 🌅", body: "Ontario's morning brief is ready. 2 minutes to stay informed.", url: "/daily" },
  { title: "Start your day informed 📍", body: "New Ontario stories just dropped. See what's happening.", url: "/daily" },
  { title: "Your morning Ontario brief", body: "3 issues. Left, centre, and right perspectives. Takes 2 minutes.", url: "/daily" },
  { title: "Don't break your streak 🔥", body: "Today's stories are live. Keep it going.", url: "/daily" },
  { title: "Ontario news, no spin ☀️", body: "What's happening in your province this morning.", url: "/daily" },
];

export async function GET(req: Request) {
  try {
    webpush.setVapidDetails(
      process.env.VAPID_EMAIL!,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subs = await db.select().from(pushSubscriptions);
    if (!subs.length) return NextResponse.json({ sent: 0 });

    const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
    const payload = JSON.stringify({ ...msg, tag: "daily-feed" });

    const results = await Promise.allSettled(
      subs.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
      )
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(`Push cron: ${sent} sent, ${failed} failed`);
    return NextResponse.json({ sent, failed });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
