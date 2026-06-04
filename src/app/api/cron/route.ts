import { NextResponse } from "next/server";
import webpush from "web-push";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";

const MESSAGES = [
  { title: "Ontario Feed is Live 🗞️", body: "3 new stories just dropped. Swipe through.", url: "/daily" },
  { title: "What's happening in Ontario?", body: "Today's feed is ready. Stay informed.", url: "/daily" },
  { title: "Your daily Ontario briefing 📍", body: "New stories are waiting. Takes 2 minutes.", url: "/daily" },
  { title: "Don't break your streak 🔥", body: "Today's stories are live. Keep it going.", url: "/daily" },
  { title: "New perspectives just dropped", body: "See what the left, centre, and right are saying.", url: "/daily" },
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